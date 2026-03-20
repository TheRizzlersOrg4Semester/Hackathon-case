import { CampaignStatus, DonationType, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildAnonymitySplit,
  buildDailyDonationSeries,
  buildDonationTypeDistribution,
  calculateAverageDonation,
  getCampaignAnalytics
} from "../../lib/services/analytics";

describe("calculateAverageDonation", () => {
  it("returns zero when there are no donations", () => {
    expect(calculateAverageDonation(0, 0)).toBe(0);
  });

  it("calculates the average donation amount", () => {
    expect(calculateAverageDonation(900, 4)).toBe(225);
  });
});

describe("buildDonationTypeDistribution", () => {
  it("separates one-time and recurring donations with counts and amounts", () => {
    const distribution = buildDonationTypeDistribution(
      [
        {
          donationType: DonationType.ONE_TIME,
          count: 3,
          totalAmount: 900
        },
        {
          donationType: DonationType.RECURRING,
          count: 1,
          totalAmount: 250
        }
      ],
      4
    );

    expect(distribution.oneTime).toMatchObject({
      count: 3,
      totalAmount: 900,
      sharePercent: 75
    });
    expect(distribution.recurring).toMatchObject({
      count: 1,
      totalAmount: 250,
      sharePercent: 25
    });
  });
});

describe("buildAnonymitySplit", () => {
  it("counts anonymous and non-anonymous donations separately", () => {
    const split = buildAnonymitySplit(
      [
        {
          isAnonymous: true,
          count: 2
        },
        {
          isAnonymous: false,
          count: 3
        }
      ],
      5
    );

    expect(split).toEqual({
      anonymousCount: 2,
      namedCount: 3,
      anonymousSharePercent: 40,
      namedSharePercent: 60
    });
  });
});

describe("buildDailyDonationSeries", () => {
  it("groups donations by UTC day, fills gaps, and computes cumulative progress", () => {
    const series = buildDailyDonationSeries(
      [
        {
          createdAt: new Date("2026-03-17T08:00:00.000Z"),
          amount: 100
        },
        {
          createdAt: new Date("2026-03-17T12:00:00.000Z"),
          amount: 150
        },
        {
          createdAt: new Date("2026-03-19T09:15:00.000Z"),
          amount: 250
        }
      ],
      1000
    );

    expect(series).toHaveLength(3);
    expect(series.map((point) => point.dateKey)).toEqual(["2026-03-17", "2026-03-18", "2026-03-19"]);
    expect(series.map((point) => point.totalAmount)).toEqual([250, 0, 250]);
    expect(series.map((point) => point.donationCount)).toEqual([2, 0, 1]);
    expect(series.map((point) => point.cumulativeAmount)).toEqual([250, 250, 500]);
    expect(series[2]?.cumulativePercent).toBe(50);
  });
});

describe("getCampaignAnalytics", () => {
  it("builds campaign analytics from persistence query results", async () => {
    const analytics = await getCampaignAnalytics("campaign-1", {
      persistence: {
        async getCampaignAnalyticsData() {
          return {
            campaign: {
              id: "campaign-1",
              title: "Ocean Cleanup Sprint",
              goalAmount: new Prisma.Decimal(2000),
              status: CampaignStatus.PUBLISHED
            },
            donationSummary: {
              _count: {
                _all: 3
              },
              _avg: {
                amount: new Prisma.Decimal(300)
              },
              _sum: {
                amount: new Prisma.Decimal(900)
              }
            },
            donationTypeRows: [
              {
                donationType: DonationType.ONE_TIME,
                _count: {
                  _all: 2
                },
                _sum: {
                  amount: new Prisma.Decimal(650)
                }
              },
              {
                donationType: DonationType.RECURRING,
                _count: {
                  _all: 1
                },
                _sum: {
                  amount: new Prisma.Decimal(250)
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
                  _all: 2
                }
              }
            ],
            activityRows: [
              {
                createdAt: new Date("2026-03-17T08:00:00.000Z"),
                amount: new Prisma.Decimal(300)
              },
              {
                createdAt: new Date("2026-03-18T10:00:00.000Z"),
                amount: new Prisma.Decimal(350)
              },
              {
                createdAt: new Date("2026-03-18T16:00:00.000Z"),
                amount: new Prisma.Decimal(250)
              }
            ]
          };
        }
      }
    });

    expect(analytics).not.toBeNull();
    expect(analytics).toMatchObject({
      campaignId: "campaign-1",
      campaignTitle: "Ocean Cleanup Sprint",
      totalRaised: 900,
      donationCount: 3,
      averageDonation: 300,
      progressPercent: 45
    });
    expect(analytics?.donationTypeDistribution.oneTime.count).toBe(2);
    expect(analytics?.anonymitySplit.anonymousCount).toBe(1);
    expect(analytics?.dailySeries.map((point) => point.totalAmount)).toEqual([300, 600]);
  });
});
