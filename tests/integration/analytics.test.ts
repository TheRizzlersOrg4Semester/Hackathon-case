import { CampaignStatus, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getCampaignAnalytics, getPlatformAnalyticsSummary } from "../../lib/services/analytics";

describe("analytics services", () => {
  it("aggregates campaign analytics from raw persistence data", async () => {
    const result = await getCampaignAnalytics("campaign-1", {
      persistence: {
        async getCampaignAnalyticsData() {
          return {
            campaign: {
              id: "campaign-1",
              title: "Community Solar Roof",
              goalAmount: new Prisma.Decimal(5000),
              status: CampaignStatus.PUBLISHED
            },
            donationSummary: {
              _count: {
                _all: 4
              },
              _avg: {
                amount: new Prisma.Decimal(500)
              },
              _sum: {
                amount: new Prisma.Decimal(2000)
              }
            },
            donationTypeRows: [
              {
                donationType: "ONE_TIME",
                _count: {
                  _all: 3
                },
                _sum: {
                  amount: new Prisma.Decimal(1500)
                }
              },
              {
                donationType: "RECURRING",
                _count: {
                  _all: 1
                },
                _sum: {
                  amount: new Prisma.Decimal(500)
                }
              }
            ],
            anonymityRows: [
              {
                isAnonymous: true,
                _count: {
                  _all: 1
                }
              },
              {
                isAnonymous: false,
                _count: {
                  _all: 3
                }
              }
            ],
            activityRows: [
              {
                createdAt: new Date("2026-03-15T09:00:00.000Z"),
                amount: new Prisma.Decimal(500)
              },
              {
                createdAt: new Date("2026-03-16T09:00:00.000Z"),
                amount: new Prisma.Decimal(500)
              },
              {
                createdAt: new Date("2026-03-16T12:00:00.000Z"),
                amount: new Prisma.Decimal(300)
              },
              {
                createdAt: new Date("2026-03-18T12:00:00.000Z"),
                amount: new Prisma.Decimal(700)
              }
            ]
          };
        }
      }
    });

    expect(result).toMatchObject({
      campaignId: "campaign-1",
      totalRaised: 2000,
      donationCount: 4,
      averageDonation: 500,
      progressPercent: 40
    });
    expect(result?.dailySeries.map((point) => point.dateKey)).toEqual([
      "2026-03-15",
      "2026-03-16",
      "2026-03-17",
      "2026-03-18"
    ]);
    expect(result?.dailySeries.map((point) => point.cumulativeAmount)).toEqual([500, 1300, 1300, 2000]);
  });

  it("aggregates platform-level analytics for the admin dashboard", async () => {
    const summary = await getPlatformAnalyticsSummary({
      persistence: {
        async getPlatformAnalyticsData() {
          return {
            totalCampaigns: 7,
            donationSummary: {
              _count: {
                _all: 12
              },
              _avg: {
                amount: new Prisma.Decimal(250)
              },
              _sum: {
                amount: new Prisma.Decimal(3000)
              }
            },
            campaignCounts: {
              DRAFT: 2,
              PUBLISHED: 4,
              CLOSED: 1
            },
            pendingRequestCount: 3,
            donationTypeRows: [
              {
                donationType: "ONE_TIME",
                _count: {
                  _all: 9
                },
                _sum: {
                  amount: new Prisma.Decimal(2200)
                }
              },
              {
                donationType: "RECURRING",
                _count: {
                  _all: 3
                },
                _sum: {
                  amount: new Prisma.Decimal(800)
                }
              }
            ],
            anonymityRows: [
              {
                isAnonymous: true,
                _count: {
                  _all: 4
                }
              },
              {
                isAnonymous: false,
                _count: {
                  _all: 8
                }
              }
            ],
            activityRows: [
              {
                createdAt: new Date("2026-03-15T08:00:00.000Z"),
                amount: new Prisma.Decimal(1200)
              },
              {
                createdAt: new Date("2026-03-16T08:00:00.000Z"),
                amount: new Prisma.Decimal(800)
              },
              {
                createdAt: new Date("2026-03-17T08:00:00.000Z"),
                amount: new Prisma.Decimal(1000)
              }
            ],
            campaignPerformanceRows: [
              {
                campaignId: "campaign-1",
                _count: {
                  _all: 5
                },
                _sum: {
                  amount: new Prisma.Decimal(1800)
                }
              }
            ],
            campaignMetaRows: [
              {
                id: "campaign-1",
                title: "Water for All",
                status: CampaignStatus.PUBLISHED,
                goalAmount: new Prisma.Decimal(5000),
                updatedAt: new Date("2026-03-18T08:00:00.000Z")
              }
            ],
            quickLinks: [
              {
                id: "campaign-1",
                title: "Water for All",
                status: CampaignStatus.PUBLISHED,
                updatedAt: new Date("2026-03-18T08:00:00.000Z")
              }
            ]
          };
        }
      }
    });

    expect(summary).toMatchObject({
      totalCampaigns: 7,
      totalDonations: 12,
      totalRaised: 3000,
      averageDonation: 250,
      pendingRequestCount: 3
    });
    expect(summary.donationTypeDistribution.oneTime.count).toBe(9);
    expect(summary.anonymitySplit.anonymousCount).toBe(4);
    expect(summary.dailySeries).toHaveLength(3);
    expect(summary.topCampaigns[0]?.totalRaised).toBe(1800);
    expect(summary.campaignCounts).toEqual({
      DRAFT: 2,
      PUBLISHED: 4,
      CLOSED: 1
    });
    expect(summary.quickLinks[0]?.title).toBe("Water for All");
  });
});
