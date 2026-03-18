import { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/persistence/prisma";

export async function getPublishedCampaigns() {
  return prisma.campaign.findMany({
    where: { status: CampaignStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    include: {
      category: {
        select: {
          name: true,
          slug: true
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
