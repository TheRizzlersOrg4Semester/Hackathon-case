import { CampaignStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/persistence/prisma";

const campaignRequestInputSchema = z.object({
  requesterName: z.string().trim().min(2).max(80),
  requesterEmail: z.string().trim().email().max(120),
  title: z.string().trim().min(5).max(140),
  category: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(12).max(240),
  description: z.string().trim().min(30).max(6000),
  goalAmount: z.coerce.number().positive().max(100000000),
  motivation: z.string().trim().min(12).max(2000)
});

const campaignRequestReviewInputSchema = z.object({
  requestId: z.string().trim().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewedById: z.string().trim().optional()
});

const CAMPAIGN_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
} as const;

type CampaignRequestStatus = (typeof CAMPAIGN_REQUEST_STATUS)[keyof typeof CAMPAIGN_REQUEST_STATUS];

export type CampaignRequestInput = z.input<typeof campaignRequestInputSchema>;
export type ValidCampaignRequestInput = z.output<typeof campaignRequestInputSchema>;

export type CampaignRequestReviewInput = z.input<typeof campaignRequestReviewInputSchema>;
export type ValidCampaignRequestReviewInput = z.output<typeof campaignRequestReviewInputSchema>;

type CampaignRequestRef = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  goalAmount: Prisma.Decimal;
  status: CampaignRequestStatus;
};

type CreatedCampaignRef = {
  id: string;
};

export type CampaignRequestPersistence = {
  createCampaignRequest: (data: {
    requesterName: string;
    requesterEmail: string;
    title: string;
    category: string;
    summary: string;
    description: string;
    goalAmount: number;
    motivation: string;
  }) => Promise<{ id: string }>;
  getCampaignRequestById: (id: string) => Promise<CampaignRequestRef | null>;
  findCategoryIdByLabel: (label: string) => Promise<string | null>;
  campaignSlugExists: (slug: string) => Promise<boolean>;
  createDraftCampaignFromRequest: (data: {
    title: string;
    slug: string;
    summary: string;
    description: string;
    goalAmount: Prisma.Decimal;
    categoryId: string | null;
  }) => Promise<CreatedCampaignRef>;
  updateCampaignRequestReview: (data: {
    requestId: string;
    status: CampaignRequestStatus;
    reviewedAt: Date;
    reviewedById: string | null;
    approvedCampaignId?: string | null;
  }) => Promise<void>;
};

function normalizeOptionalString(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function buildUniqueCampaignSlug(
  title: string,
  persistence: Pick<CampaignRequestPersistence, "campaignSlugExists">
): Promise<string> {
  const baseSlug = slugify(title) || `campaign-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (await persistence.campaignSlugExists(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function validateCampaignRequestInput(input: CampaignRequestInput): ValidCampaignRequestInput {
  return campaignRequestInputSchema.parse(input);
}

export function validateCampaignRequestReviewInput(input: CampaignRequestReviewInput): ValidCampaignRequestReviewInput {
  return campaignRequestReviewInputSchema.parse(input);
}

function getDefaultCampaignRequestPersistence(tx: Prisma.TransactionClient): CampaignRequestPersistence {
  return {
    async createCampaignRequest(data) {
      return tx.campaignRequest.create({
        data,
        select: {
          id: true
        }
      });
    },
    async getCampaignRequestById(id) {
      return tx.campaignRequest.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          summary: true,
          description: true,
          category: true,
          goalAmount: true,
          status: true
        }
      });
    },
    async findCategoryIdByLabel(label) {
      const normalized = label.trim().toLowerCase();
      const category = await tx.category.findFirst({
        where: {
          OR: [{ slug: normalized.replace(/\s+/g, "-") }, { name: { equals: label.trim(), mode: "insensitive" } }]
        },
        select: {
          id: true
        }
      });

      return category?.id ?? null;
    },
    async campaignSlugExists(slug) {
      const count = await tx.campaign.count({ where: { slug } });
      return count > 0;
    },
    async createDraftCampaignFromRequest(data) {
      return tx.campaign.create({
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          goalAmount: data.goalAmount,
          status: CampaignStatus.DRAFT,
          categoryId: data.categoryId
        },
        select: {
          id: true
        }
      });
    },
    async updateCampaignRequestReview(data) {
      await tx.campaignRequest.update({
        where: { id: data.requestId },
        data: {
          status: data.status,
          reviewedAt: data.reviewedAt,
          reviewedById: data.reviewedById,
          approvedCampaignId: data.approvedCampaignId
        }
      });
    }
  };
}

export async function createCampaignRequest(
  input: CampaignRequestInput,
  deps?: {
    persistence?: CampaignRequestPersistence;
  }
): Promise<{ requestId: string }> {
  const validated = validateCampaignRequestInput(input);

  const runFlow = async (persistence: CampaignRequestPersistence) => {
    const created = await persistence.createCampaignRequest({
      requesterName: validated.requesterName,
      requesterEmail: validated.requesterEmail,
      title: validated.title,
      category: validated.category,
      summary: validated.summary,
      description: validated.description,
      goalAmount: validated.goalAmount,
      motivation: validated.motivation
    });

    return {
      requestId: created.id
    };
  };

  if (deps?.persistence) {
    return runFlow(deps.persistence);
  }

  return prisma.$transaction(async (tx) => runFlow(getDefaultCampaignRequestPersistence(tx)));
}

export async function reviewCampaignRequest(
  input: CampaignRequestReviewInput,
  deps?: {
    now?: () => Date;
    persistence?: CampaignRequestPersistence;
  }
): Promise<{ approvedCampaignId: string | null }> {
  const validated = validateCampaignRequestReviewInput(input);
  const reviewedById = normalizeOptionalString(validated.reviewedById);
  const now = deps?.now?.() ?? new Date();

  const runFlow = async (persistence: CampaignRequestPersistence) => {
    const request = await persistence.getCampaignRequestById(validated.requestId);

    if (!request) {
      throw new Error("Campaign request not found.");
    }

    if (request.status !== CAMPAIGN_REQUEST_STATUS.PENDING) {
      throw new Error("Campaign request has already been reviewed.");
    }

    if (validated.decision === "REJECTED") {
      await persistence.updateCampaignRequestReview({
        requestId: request.id,
        status: CAMPAIGN_REQUEST_STATUS.REJECTED,
        reviewedAt: now,
        reviewedById,
        approvedCampaignId: null
      });

      return {
        approvedCampaignId: null
      };
    }

    const slug = await buildUniqueCampaignSlug(request.title, persistence);
    const categoryId = await persistence.findCategoryIdByLabel(request.category);
    const createdCampaign = await persistence.createDraftCampaignFromRequest({
      title: request.title,
      slug,
      summary: request.summary,
      description: request.description,
      goalAmount: request.goalAmount,
      categoryId
    });

    await persistence.updateCampaignRequestReview({
      requestId: request.id,
      status: CAMPAIGN_REQUEST_STATUS.APPROVED,
      reviewedAt: now,
      reviewedById,
      approvedCampaignId: createdCampaign.id
    });

    return {
      approvedCampaignId: createdCampaign.id
    };
  };

  if (deps?.persistence) {
    return runFlow(deps.persistence);
  }

  return prisma.$transaction(async (tx) => runFlow(getDefaultCampaignRequestPersistence(tx)));
}
