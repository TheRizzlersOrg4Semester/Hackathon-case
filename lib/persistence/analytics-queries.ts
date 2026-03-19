import { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/persistence/prisma";

export type CampaignAnalyticsQueryData = {
  campaign: {
    id: string;
    title: string;
    goalAmount: Prisma.Decimal;
    status: CampaignStatus;
  };
  donationSummary: {
    _count: {
      _all: number;
    };
    _avg: {
      amount: Prisma.Decimal | null;
    };
    _sum: {
      amount: Prisma.Decimal | null;
    };
  };
  donationTypeRows: Array<{
    donationType: "ONE_TIME" | "RECURRING";
    _count: {
      _all: number;
    };
    _sum: {
      amount: Prisma.Decimal | null;
    };
  }>;
  anonymityRows: Array<{
    isAnonymous: boolean;
    _count: {
      _all: number;
    };
  }>;
  activityRows: Array<{
    createdAt: Date;
    amount: Prisma.Decimal;
  }>;
};

export type PlatformAnalyticsQueryData = {
  totalCampaigns: number;
  donationSummary: {
    _count: {
      _all: number;
    };
    _avg: {
      amount: Prisma.Decimal | null;
    };
    _sum: {
      amount: Prisma.Decimal | null;
    };
  };
  campaignCounts: {
    DRAFT: number;
    PUBLISHED: number;
    CLOSED: number;
  };
  pendingRequestCount: number;
  donationTypeRows: Array<{
    donationType: "ONE_TIME" | "RECURRING";
    _count: {
      _all: number;
    };
    _sum: {
      amount: Prisma.Decimal | null;
    };
  }>;
  anonymityRows: Array<{
    isAnonymous: boolean;
    _count: {
      _all: number;
    };
  }>;
  activityRows: Array<{
    createdAt: Date;
    amount: Prisma.Decimal;
  }>;
  campaignPerformanceRows: Array<{
    campaignId: string;
    _count: {
      _all: number;
    };
    _sum: {
      amount: Prisma.Decimal | null;
    };
  }>;
  campaignMetaRows: Array<{
    id: string;
    title: string;
    status: CampaignStatus;
    goalAmount: Prisma.Decimal;
    updatedAt: Date;
  }>;
  quickLinks: Array<{
    id: string;
    title: string;
    status: CampaignStatus;
    updatedAt: Date;
  }>;
};

export async function getCampaignAnalyticsQueryData(campaignId: string): Promise<CampaignAnalyticsQueryData | null> {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId
    },
    select: {
      id: true,
      title: true,
      goalAmount: true,
      status: true
    }
  });

  if (!campaign) {
    return null;
  }

  const [donationSummary, donationTypeRows, anonymityRows, activityRows] = await Promise.all([
    prisma.donation.aggregate({
      where: {
        campaignId
      },
      _count: {
        _all: true
      },
      _avg: {
        amount: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.donation.groupBy({
      by: ["donationType"],
      where: {
        campaignId
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.donation.groupBy({
      by: ["isAnonymous"],
      where: {
        campaignId
      },
      _count: {
        _all: true
      }
    }),
    prisma.donation.findMany({
      where: {
        campaignId
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        createdAt: true,
        amount: true
      }
    })
  ]);

  return {
    campaign,
    donationSummary,
    donationTypeRows,
    anonymityRows,
    activityRows
  };
}

export async function getPlatformAnalyticsQueryData(): Promise<PlatformAnalyticsQueryData> {
  const [
    totalCampaigns,
    donationSummary,
    campaignsByStatus,
    pendingRequestCount,
    donationTypeRows,
    anonymityRows,
    activityRows,
    campaignPerformanceRows,
    campaignMetaRows,
    quickLinks
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.donation.aggregate({
      _count: {
        _all: true
      },
      _avg: {
        amount: true
      },
      _sum: {
        amount: true
      }
    }),
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
    prisma.donation.groupBy({
      by: ["donationType"],
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.donation.groupBy({
      by: ["isAnonymous"],
      _count: {
        _all: true
      }
    }),
    prisma.donation.findMany({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        createdAt: true,
        amount: true
      }
    }),
    prisma.donation.groupBy({
      by: ["campaignId"],
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      }
    }),
    prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        goalAmount: true,
        updatedAt: true
      }
    }),
    prisma.campaign.findMany({
      take: 6,
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      }
    })
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
    totalCampaigns,
    donationSummary,
    campaignCounts,
    pendingRequestCount,
    donationTypeRows,
    anonymityRows,
    activityRows,
    campaignPerformanceRows,
    campaignMetaRows,
    quickLinks
  };
}
