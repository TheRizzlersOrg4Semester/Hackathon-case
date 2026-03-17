import { CampaignStatus, DonationType, EmailStatus, Prisma, ThankYouTier } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/persistence/prisma";

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
    })
});

export type DonationInput = z.input<typeof donationInputSchema>;
export type ValidDonationInput = z.output<typeof donationInputSchema>;

type PublishedCampaignRef = {
  id: string;
};

type CreatedDonation = {
  id: string;
  amount: Prisma.Decimal;
};

export type DonationFlowPersistence = {
  getPublishedCampaignById: (campaignId: string) => Promise<PublishedCampaignRef | null>;
  createDonation: (data: {
    campaignId: string;
    amount: number;
    donationType: DonationType;
    isAnonymous: boolean;
    donorName: string | null;
    donorEmail: string | null;
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

function getDefaultDonationPersistence(tx: Prisma.TransactionClient): DonationFlowPersistence {
  return {
    async getPublishedCampaignById(campaignId: string) {
      return tx.campaign.findFirst({
        where: {
          id: campaignId,
          status: CampaignStatus.PUBLISHED
        },
        select: {
          id: true
        }
      });
    },
    async createDonation(data) {
      return tx.donation.create({
        data: {
          campaignId: data.campaignId,
          amount: data.amount,
          donationType: data.donationType,
          isAnonymous: data.isAnonymous,
          donorName: data.donorName,
          donorEmail: data.donorEmail
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
};

export async function createDonationWithSimulatedPayment(
  input: DonationInput,
  deps?: {
    now?: () => Date;
    randomDigits?: () => string;
    persistence?: DonationFlowPersistence;
  }
): Promise<CreateDonationResult> {
  const validated = validateDonationInput(input);
  const now = deps?.now?.() ?? new Date();
  const randomDigits = deps?.randomDigits?.() ?? String(Math.floor(100000 + Math.random() * 900000));

  const runFlow = async (persistence: DonationFlowPersistence) => {
    const campaign = await persistence.getPublishedCampaignById(validated.campaignId);

    if (!campaign) {
      throw new Error("Campaign is not available for donations.");
    }

    const donation = await persistence.createDonation({
      campaignId: validated.campaignId,
      amount: validated.amount,
      donationType: validated.donationType,
      isAnonymous: validated.isAnonymous,
      donorName: normalizeOptionalString(validated.donorName),
      donorEmail: normalizeOptionalString(validated.donorEmail)
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
      thankYouTier: tier
    };
  };

  if (deps?.persistence) {
    return runFlow(deps.persistence);
  }

  return prisma.$transaction(async (tx) => {
    const persistence = getDefaultDonationPersistence(tx);
    return runFlow(persistence);
  });
}
