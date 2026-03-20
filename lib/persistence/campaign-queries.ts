import { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/persistence/prisma";

export function buildPublishedCampaignSearchWhere(query?: string): Prisma.CampaignWhereInput {
  const normalized = query?.trim();

  if (!normalized) {
    return {
      status: CampaignStatus.PUBLISHED
    };
  }

  return {
    status: CampaignStatus.PUBLISHED,
    OR: [
      {
        title: {
          contains: normalized,
          mode: "insensitive"
        }
      },
      {
        summary: {
          contains: normalized,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: normalized,
          mode: "insensitive"
        }
      },
      {
        category: {
          is: {
            name: {
              contains: normalized,
              mode: "insensitive"
            }
          }
        }
      }
    ]
  };
}

export async function getPublishedCampaigns(query?: string) {
  return prisma.campaign.findMany({
    where: buildPublishedCampaignSearchWhere(query),
    orderBy: { publishedAt: "desc" },
    include: {
      category: {
        select: {
          name: true,
          slug: true
        }
      },
      milestones: {
        orderBy: [{ displayOrder: "asc" }, { targetAmount: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          targetAmount: true,
          displayOrder: true
        }
      },
      donations: {
        select: {
          amount: true
        }
      }
    }
  });
}

export async function getPublishedCampaignById(id: string) {
  return prisma.campaign.findFirst({
    where: {
      id,
      status: CampaignStatus.PUBLISHED
    },
    include: {
      category: {
        select: {
          name: true
        }
      },
      milestones: {
        orderBy: [{ displayOrder: "asc" }, { targetAmount: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          targetAmount: true,
          displayOrder: true
        }
      },
      donations: {
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          amount: true,
          donorName: true,
          donorEmail: true,
          donationAccessId: true,
          isAnonymous: true,
          donationType: true,
          blobColor: true,
          createdAt: true
        }
      }
    }
  });
}

export async function getPublishedCampaignDonationTarget(id: string) {
  return prisma.campaign.findFirst({
    where: {
      id,
      status: CampaignStatus.PUBLISHED
    },
    select: {
      id: true,
      title: true,
      summary: true
    }
  });
}

export async function getLandingCampaignData() {
  return prisma.campaign.findMany({
    where: { status: CampaignStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      brandImageUrl: true,
      goalAmount: true,
      category: {
        select: {
          name: true
        }
      },
      donations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          donorName: true,
          donationAccessId: true,
          isAnonymous: true,
          donationType: true,
          blobColor: true,
          createdAt: true
        }
      }
    }
  });
}
