import { CampaignStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { assertCampaignStatusTransition } from "@/lib/domain/campaign-admin";
import { prisma } from "@/lib/persistence/prisma";

const campaignInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens only."),
  categoryId: z.string().trim().optional(),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(6000),
  goalAmount: z.coerce.number().positive().max(100000000),
  brandImageUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Campaign image/logo must be a valid URL."
    })
});

export type CampaignAdminInput = z.input<typeof campaignInputSchema>;
export type ValidCampaignAdminInput = z.output<typeof campaignInputSchema>;

type CampaignStatusRef = {
  id: string;
  status: CampaignStatus;
};

type CampaignRecord = {
  id: string;
};

export type CampaignAdminPersistence = {
  getCampaignStatusById: (campaignId: string) => Promise<CampaignStatusRef | null>;
  createCampaign: (data: {
    title: string;
    slug: string;
    summary: string;
    description: string;
    goalAmount: number;
    categoryId: string | null;
    brandImageUrl: string | null;
  }) => Promise<CampaignRecord>;
  updateCampaign: (
    campaignId: string,
    data: {
      title: string;
      slug: string;
      summary: string;
      description: string;
      goalAmount: number;
      categoryId: string | null;
      brandImageUrl: string | null;
    }
  ) => Promise<void>;
  updateCampaignStatus: (
    campaignId: string,
    status: CampaignStatus,
    dates: {
      publishedAt?: Date | null;
      closedAt?: Date | null;
    }
  ) => Promise<void>;
  deleteDonationById: (donationId: string) => Promise<boolean>;
};

function normalizeOptionalString(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateCampaignAdminInput(input: CampaignAdminInput): ValidCampaignAdminInput {
  return campaignInputSchema.parse(input);
}

function getDefaultAdminPersistence(tx: Prisma.TransactionClient): CampaignAdminPersistence {
  return {
    async getCampaignStatusById(campaignId) {
      return tx.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          status: true
        }
      });
    },
    async createCampaign(data) {
      return tx.campaign.create({
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          goalAmount: data.goalAmount,
          categoryId: data.categoryId,
          brandImageUrl: data.brandImageUrl,
          status: CampaignStatus.DRAFT
        },
        select: {
          id: true
        }
      });
    },
    async updateCampaign(campaignId, data) {
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          goalAmount: data.goalAmount,
          categoryId: data.categoryId,
          brandImageUrl: data.brandImageUrl
        }
      });
    },
    async updateCampaignStatus(campaignId, status, dates) {
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status,
          publishedAt: dates.publishedAt,
          closedAt: dates.closedAt
        }
      });
    },
    async deleteDonationById(donationId) {
      const result = await tx.donation.deleteMany({
        where: {
          id: donationId
        }
      });

      return result.count > 0;
    }
  };
}

export async function createCampaignByAdmin(
  input: CampaignAdminInput,
  deps?: {
    persistence?: CampaignAdminPersistence;
  }
): Promise<{ campaignId: string }> {
  const validated = validateCampaignAdminInput(input);

  const runFlow = async (persistence: CampaignAdminPersistence) => {
    const created = await persistence.createCampaign({
      title: validated.title,
      slug: validated.slug,
      summary: validated.summary,
      description: validated.description,
      goalAmount: validated.goalAmount,
      categoryId: normalizeOptionalString(validated.categoryId),
      brandImageUrl: normalizeOptionalString(validated.brandImageUrl)
    });

    return {
      campaignId: created.id
    };
  };

  if (deps?.persistence) {
    return runFlow(deps.persistence);
  }

  return prisma.$transaction(async (tx) => runFlow(getDefaultAdminPersistence(tx)));
}

export async function updateCampaignByAdmin(
  campaignId: string,
  input: CampaignAdminInput,
  deps?: {
    persistence?: CampaignAdminPersistence;
  }
): Promise<void> {
  const validated = validateCampaignAdminInput(input);

  const runFlow = async (persistence: CampaignAdminPersistence) => {
    await persistence.updateCampaign(campaignId, {
      title: validated.title,
      slug: validated.slug,
      summary: validated.summary,
      description: validated.description,
      goalAmount: validated.goalAmount,
      categoryId: normalizeOptionalString(validated.categoryId),
      brandImageUrl: normalizeOptionalString(validated.brandImageUrl)
    });
  };

  if (deps?.persistence) {
    await runFlow(deps.persistence);
    return;
  }

  await prisma.$transaction(async (tx) => runFlow(getDefaultAdminPersistence(tx)));
}

export async function transitionCampaignStatusByAdmin(
  campaignId: string,
  nextStatus: CampaignStatus,
  deps?: {
    now?: () => Date;
    persistence?: CampaignAdminPersistence;
  }
): Promise<void> {
  const now = deps?.now?.() ?? new Date();

  const runFlow = async (persistence: CampaignAdminPersistence) => {
    const campaign = await persistence.getCampaignStatusById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    assertCampaignStatusTransition(campaign.status, nextStatus);

    await persistence.updateCampaignStatus(campaignId, nextStatus, {
      publishedAt: nextStatus === CampaignStatus.PUBLISHED ? now : undefined,
      closedAt: nextStatus === CampaignStatus.CLOSED ? now : undefined
    });
  };

  if (deps?.persistence) {
    await runFlow(deps.persistence);
    return;
  }

  await prisma.$transaction(async (tx) => runFlow(getDefaultAdminPersistence(tx)));
}

export async function deleteDonationByAdmin(
  donationId: string,
  deps?: {
    persistence?: CampaignAdminPersistence;
  }
): Promise<void> {
  if (!donationId || donationId.trim().length === 0) {
    throw new Error("Donation id is required.");
  }

  const runFlow = async (persistence: CampaignAdminPersistence) => {
    const deleted = await persistence.deleteDonationById(donationId);

    if (!deleted) {
      throw new Error("Donation not found.");
    }
  };

  if (deps?.persistence) {
    await runFlow(deps.persistence);
    return;
  }

  await prisma.$transaction(async (tx) => runFlow(getDefaultAdminPersistence(tx)));
}
