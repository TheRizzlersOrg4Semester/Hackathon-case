import { prisma } from "@/lib/persistence/prisma";

export async function getAdminOverviewData() {
  const [campaignsByStatus, pendingRequestCount, totalDonationCount] = await Promise.all([
    prisma.campaign.groupBy({
      by: ["status"],
      _count: {
        _all: true
      }
    }),
    prisma.campaignRequest.count({
      where: {
        status: "PENDING"
      }
    }),
    prisma.donation.count()
  ]);

  const campaignCounts = {
    DRAFT: 0,
    PUBLISHED: 0,
    CLOSED: 0
  };

  for (const entry of campaignsByStatus) {
    campaignCounts[entry.status] = entry._count._all;
  }

  return {
    campaignCounts,
    pendingRequestCount,
    totalDonationCount
  };
}

export async function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
}

export async function getAdminCampaigns() {
  return prisma.campaign.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      description: true,
      brandImageUrl: true,
      goalAmount: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      celebrationEnabled: true,
      completedAt: true,
      _count: {
        select: {
          donations: true
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

export async function getAdminCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      description: true,
      brandImageUrl: true,
      goalAmount: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true
        }
      },
      celebrationEnabled: true,
      completedAt: true,
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
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          amount: true,
          donorName: true,
          donorEmail: true,
          isAnonymous: true,
          donationType: true,
          subscribedToUpdates: true,
          createdAt: true,
          thankYouAction: {
            select: {
              tier: true,
              emailStatus: true,
              triggeredAt: true
            }
          }
        }
      }
    }
  });
}

export async function getAdminCampaignRequests() {
  return prisma.campaignRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reviewedBy: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      },
      approvedCampaign: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });
}
