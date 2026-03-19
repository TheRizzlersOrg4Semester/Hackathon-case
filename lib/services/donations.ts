import { CampaignStatus, DonationType, EmailStatus, Prisma, TaxIdType, ThankYouTier } from "@prisma/client";
import { z } from "zod";
import {
  generateSupporterAccessCode,
  isSupporterAccessCodeFormatValid,
  normalizeSupporterAccessCode
} from "@/lib/domain/access-codes";
import { isSupportedBlobColor } from "@/lib/domain/blob-colors";
import { prisma } from "@/lib/persistence/prisma";
import {
  sendDonationThankYouEmail,
  type ThankYouEmailDelivery,
  type ThankYouEmailInput
} from "@/lib/services/thank-you-emails";

const donationInputSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.coerce.number().positive(),
  donationType: z.enum(["ONE_TIME", "RECURRING"]).default("ONE_TIME"),
  isAnonymous: z.coerce.boolean().default(false),
  donorName: z.string().trim().optional(),
  donorEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Invalid donor email"
    }),
  taxEligible: z.coerce.boolean().default(false),
  taxIdType: z.enum(["CPR", "CVR"]).optional(),
  taxId: z.string().trim().optional(),
  subscribedToUpdates: z.coerce.boolean().default(false),
  accessCodeMode: z.enum(["CREATE_NEW", "USE_EXISTING"]).default("CREATE_NEW"),
  supporterAccessCode: z.string().trim().optional(),
  blobColor: z.string().trim().optional()
}).superRefine((value, ctx) => {
  if (!value.taxEligible) {
    return;
  }

  if (!value.taxIdType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose CPR or CVR for tax deduction handling.",
      path: ["taxIdType"]
    });
  }

  if (!value.taxId || value.taxId.trim().length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a tax identifier to mark the donation as tax eligible.",
      path: ["taxId"]
    });
  }
});

export type DonationInput = z.input<typeof donationInputSchema>;
export type ValidDonationInput = z.output<typeof donationInputSchema>;

type PublishedCampaignRef = {
  id: string;
  title: string;
  summary: string | null;
};

type DonationAccessRef = {
  id: string;
  accessCode: string;
};

type CreatedDonation = {
  id: string;
  amount: Prisma.Decimal;
};

export type DonationFlowPersistence = {
  getPublishedCampaignById: (campaignId: string) => Promise<PublishedCampaignRef | null>;
  findDonationAccessByCode: (accessCode: string) => Promise<DonationAccessRef | null>;
  createDonationAccess: (accessCode: string) => Promise<DonationAccessRef>;
  createDonation: (data: {
    campaignId: string;
    donationAccessId: string;
    amount: number;
    donationType: DonationType;
    isAnonymous: boolean;
    donorName: string | null;
    donorEmail: string | null;
    taxEligible: boolean;
    taxIdType: TaxIdType | null;
    taxId: string | null;
    subscribedToUpdates: boolean;
    blobColor: string | null;
  }) => Promise<CreatedDonation>;
  createDonationReceipt: (data: {
    donationId: string;
    receiptNumber: string;
    totalAmount: Prisma.Decimal;
  }) => Promise<void>;
  createThankYouAction: (data: {
    donationId: string;
    tier: ThankYouTier;
    emailStatus: EmailStatus;
  }) => Promise<void>;
};

function normalizeOptionalString(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBlobColor(value?: string): string | null {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();
  if (!isSupportedBlobColor(upper)) {
    throw new Error("Please choose one of the supported blob colors.");
  }

  return upper;
}

function normalizeTaxId(value?: string): string | null {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  return normalized.replace(/\s+/g, "").toUpperCase();
}

export function classifyThankYouTier(amount: number): ThankYouTier {
  if (amount < 200) {
    return ThankYouTier.BASIC;
  }

  if (amount <= 1000) {
    return ThankYouTier.PERSONAL;
  }

  return ThankYouTier.FOLLOW_UP;
}

export function buildReceiptNumber(now: Date, randomDigits: string): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `RCPT-${y}${m}${d}-${randomDigits}`;
}

function buildPaymentReference(now: Date, randomDigits: string): string {
  return `SIM-${now.getTime()}-${randomDigits}`;
}

export function validateDonationInput(input: DonationInput): ValidDonationInput {
  return donationInputSchema.parse(input);
}

async function resolveDonationAccess(
  validated: ValidDonationInput,
  persistence: Pick<DonationFlowPersistence, "findDonationAccessByCode" | "createDonationAccess">,
  randomFloat: () => number
): Promise<{ access: DonationAccessRef; createdNow: boolean }> {
  if (validated.accessCodeMode === "USE_EXISTING") {
    const normalizedCode = normalizeSupporterAccessCode(validated.supporterAccessCode ?? "");

    if (!isSupporterAccessCodeFormatValid(normalizedCode)) {
      throw new Error("Supporter Access Code format is invalid.");
    }

    const existing = await persistence.findDonationAccessByCode(normalizedCode);
    if (!existing) {
      throw new Error("Supporter Access Code was not found.");
    }

    return {
      access: existing,
      createdNow: false
    };
  }

  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateSupporterAccessCode(randomFloat);
    const existing = await persistence.findDonationAccessByCode(candidate);

    if (!existing) {
      return {
        access: await persistence.createDonationAccess(candidate),
        createdNow: true
      };
    }

    attempts += 1;
  }

  throw new Error("Could not generate a unique Supporter Access Code. Please try again.");
}

function getDefaultDonationPersistence(tx: Prisma.TransactionClient): DonationFlowPersistence {
  return {
    async getPublishedCampaignById(campaignId) {
      return tx.campaign.findFirst({
        where: {
          id: campaignId,
          status: CampaignStatus.PUBLISHED
        },
        select: {
          id: true,
          title: true,
          summary: true
        }
      });
    },
    async findDonationAccessByCode(accessCode) {
      return tx.donationAccess.findUnique({
        where: {
          accessCode
        },
        select: {
          id: true,
          accessCode: true
        }
      });
    },
    async createDonationAccess(accessCode) {
      return tx.donationAccess.create({
        data: {
          accessCode
        },
        select: {
          id: true,
          accessCode: true
        }
      });
    },
    async createDonation(data) {
      return tx.donation.create({
        data: {
          campaignId: data.campaignId,
          donationAccessId: data.donationAccessId,
          amount: data.amount,
          donationType: data.donationType,
          isAnonymous: data.isAnonymous,
          donorName: data.donorName,
          donorEmail: data.donorEmail,
          taxEligible: data.taxEligible,
          taxIdType: data.taxIdType,
          taxId: data.taxId,
          subscribedToUpdates: data.subscribedToUpdates,
          blobColor: data.blobColor
        },
        select: {
          id: true,
          amount: true
        }
      });
    },
    async createDonationReceipt(data) {
      await tx.donationReceipt.create({
        data: {
          donationId: data.donationId,
          receiptNumber: data.receiptNumber,
          totalAmount: data.totalAmount
        }
      });
    },
    async createThankYouAction(data) {
      await tx.thankYouAction.create({
        data: {
          donationId: data.donationId,
          tier: data.tier,
          emailStatus: data.emailStatus
        }
      });
    }
  };
}

export type CreateDonationResult = {
  donationId: string;
  receiptNumber: string;
  paymentReference: string;
  thankYouTier: ThankYouTier;
  supporterAccessCode: string;
  supporterAccessCodeCreated: boolean;
  thankYouEmailDelivery: ThankYouEmailDelivery;
};

type DonationFlowInternalResult = {
  donationId: string;
  receiptNumber: string;
  paymentReference: string;
  thankYouTier: ThankYouTier;
  supporterAccessCode: string;
  supporterAccessCodeCreated: boolean;
  donorEmail: string | null;
  donorName: string | null;
  campaignId: string;
  campaignTitle: string;
  campaignSummary: string | null;
  amount: number;
  donationType: DonationType;
};

type UpdateThankYouActionStatusInput = {
  donationId: string;
  emailStatus: EmailStatus;
  triggeredAt: Date | null;
};

async function updateThankYouActionStatus(data: UpdateThankYouActionStatusInput): Promise<void> {
  await prisma.thankYouAction.update({
    where: {
      donationId: data.donationId
    },
    data: {
      emailStatus: data.emailStatus,
      triggeredAt: data.triggeredAt
    }
  });
}

export async function createDonationWithSimulatedPayment(
  input: DonationInput,
  deps?: {
    now?: () => Date;
    randomDigits?: () => string;
    randomFloat?: () => number;
    persistence?: DonationFlowPersistence;
    sendThankYouEmail?: (input: ThankYouEmailInput) => Promise<ThankYouEmailDelivery>;
    updateThankYouActionStatus?: (data: UpdateThankYouActionStatusInput) => Promise<void>;
  }
): Promise<CreateDonationResult> {
  const validated = validateDonationInput(input);
  const now = deps?.now?.() ?? new Date();
  const randomDigits = deps?.randomDigits?.() ?? String(Math.floor(100000 + Math.random() * 900000));
  const randomFloat = deps?.randomFloat ?? Math.random;

  const runFlow = async (persistence: DonationFlowPersistence): Promise<DonationFlowInternalResult> => {
    const campaign = await persistence.getPublishedCampaignById(validated.campaignId);

    if (!campaign) {
      throw new Error("Campaign is not available for donations.");
    }

    const accessResolution = await resolveDonationAccess(validated, persistence, randomFloat);
    const donorName = normalizeOptionalString(validated.donorName);
    const donorEmail = normalizeOptionalString(validated.donorEmail);
    const taxEligible = validated.taxEligible;
    const taxIdType = taxEligible ? (validated.taxIdType ?? null) : null;
    const taxId = taxEligible ? normalizeTaxId(validated.taxId) : null;

    const donation = await persistence.createDonation({
      campaignId: validated.campaignId,
      donationAccessId: accessResolution.access.id,
      amount: validated.amount,
      donationType: validated.donationType,
      isAnonymous: validated.isAnonymous,
      donorName,
      donorEmail,
      taxEligible,
      taxIdType,
      taxId,
      subscribedToUpdates: validated.subscribedToUpdates,
      blobColor: normalizeBlobColor(validated.blobColor)
    });

    const receiptNumber = buildReceiptNumber(now, randomDigits);
    const paymentReference = buildPaymentReference(now, randomDigits);
    const tier = classifyThankYouTier(validated.amount);

    await persistence.createDonationReceipt({
      donationId: donation.id,
      receiptNumber,
      totalAmount: donation.amount
    });

    await persistence.createThankYouAction({
      donationId: donation.id,
      tier,
      emailStatus: EmailStatus.PENDING
    });

    return {
      donationId: donation.id,
      receiptNumber,
      paymentReference,
      thankYouTier: tier,
      supporterAccessCode: accessResolution.access.accessCode,
      supporterAccessCodeCreated: accessResolution.createdNow,
      donorEmail,
      donorName,
      campaignId: validated.campaignId,
      campaignTitle: campaign.title,
      campaignSummary: campaign.summary,
      amount: validated.amount,
      donationType: validated.donationType
    };
  };

  const completedDonation = deps?.persistence
    ? await runFlow(deps.persistence)
    : await prisma.$transaction(async (tx) => {
        const persistence = getDefaultDonationPersistence(tx);
        return runFlow(persistence);
      });

  const sendThankYouEmail = deps?.sendThankYouEmail ?? sendDonationThankYouEmail;
  let thankYouEmailDelivery: ThankYouEmailDelivery;

  try {
    thankYouEmailDelivery = await sendThankYouEmail({
      donorEmail: completedDonation.donorEmail,
      donorName: completedDonation.donorName,
      campaignId: completedDonation.campaignId,
      campaignTitle: completedDonation.campaignTitle,
      campaignSummary: completedDonation.campaignSummary,
      amount: completedDonation.amount,
      donationType: completedDonation.donationType,
      receiptNumber: completedDonation.receiptNumber,
      paymentReference: completedDonation.paymentReference,
      supporterAccessCode: completedDonation.supporterAccessCode,
      supporterAccessCodeCreated: completedDonation.supporterAccessCodeCreated,
      thankYouTier: completedDonation.thankYouTier
    });
  } catch (error) {
    thankYouEmailDelivery = {
      status: "failed",
      message: "Takke-mailen kunne ikke behandles efter donationen.",
      error: error instanceof Error ? error.message : "Unknown email post-processing error"
    };
  }

  if (thankYouEmailDelivery.status === "triggered" || thankYouEmailDelivery.status === "failed") {
    const persistThankYouActionStatus = deps?.updateThankYouActionStatus ?? updateThankYouActionStatus;

    try {
      await persistThankYouActionStatus({
        donationId: completedDonation.donationId,
        emailStatus: thankYouEmailDelivery.status === "triggered" ? EmailStatus.TRIGGERED : EmailStatus.FAILED,
        triggeredAt: new Date()
      });
    } catch {
      // The donation has already been committed. Status-sync failure must not break the user flow.
    }
  }

  return {
    donationId: completedDonation.donationId,
    receiptNumber: completedDonation.receiptNumber,
    paymentReference: completedDonation.paymentReference,
    thankYouTier: completedDonation.thankYouTier,
    supporterAccessCode: completedDonation.supporterAccessCode,
    supporterAccessCodeCreated: completedDonation.supporterAccessCodeCreated,
    thankYouEmailDelivery
  };
}
