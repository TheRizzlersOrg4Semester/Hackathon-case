import { CampaignStatus, DonationType, Prisma } from "@prisma/client";
import {
  getCampaignAnalyticsQueryData,
  getPlatformAnalyticsQueryData,
  type CampaignAnalyticsQueryData,
  type PlatformAnalyticsQueryData
} from "@/lib/persistence/analytics-queries";

export type DonationTypeDistributionEntry = {
  count: number;
  totalAmount: number;
  sharePercent: number;
};

export type DonationTypeDistribution = {
  oneTime: DonationTypeDistributionEntry;
  recurring: DonationTypeDistributionEntry;
};

export type DonationAnonymitySplit = {
  anonymousCount: number;
  namedCount: number;
  anonymousSharePercent: number;
  namedSharePercent: number;
};

export type AnalyticsTimeSeriesPoint = {
  dateKey: string;
  label: string;
  donationCount: number;
  totalAmount: number;
  cumulativeAmount: number;
  cumulativePercent: number;
};

export type CampaignAnalytics = {
  campaignId: string;
  campaignTitle: string;
  campaignStatus: CampaignStatus;
  goalAmount: number;
  totalRaised: number;
  donationCount: number;
  averageDonation: number;
  progressPercent: number;
  donationTypeDistribution: DonationTypeDistribution;
  anonymitySplit: DonationAnonymitySplit;
  dailySeries: AnalyticsTimeSeriesPoint[];
};

export type PlatformAnalyticsSummary = {
  totalCampaigns: number;
  totalDonations: number;
  totalRaised: number;
  averageDonation: number;
  campaignCounts: {
    DRAFT: number;
    PUBLISHED: number;
    CLOSED: number;
  };
  pendingRequestCount: number;
  donationTypeDistribution: DonationTypeDistribution;
  anonymitySplit: DonationAnonymitySplit;
  dailySeries: AnalyticsTimeSeriesPoint[];
  topCampaigns: Array<{
    id: string;
    title: string;
    status: CampaignStatus;
    goalAmount: number;
    totalRaised: number;
    donationCount: number;
    progressPercent: number;
    updatedAt: Date;
  }>;
  quickLinks: Array<{
    id: string;
    title: string;
    status: CampaignStatus;
    updatedAt: Date;
  }>;
};

export type AnalyticsServicePersistence = {
  getCampaignAnalyticsData: (campaignId: string) => Promise<CampaignAnalyticsQueryData | null>;
  getPlatformAnalyticsData: () => Promise<PlatformAnalyticsQueryData>;
};

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return Number(value);
}

function roundAmount(value: number): number {
  return Number(value.toFixed(2));
}

function calculateSharePercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

function calculateProgressPercent(totalRaised: number, goalAmount: number): number {
  if (goalAmount <= 0) {
    return 0;
  }

  const rawPercent = (totalRaised / goalAmount) * 100;
  return Number(Math.max(0, Math.min(100, rawPercent)).toFixed(1));
}

function formatUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseUtcDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDayLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("da-DK", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(parseUtcDateKey(dateKey));
}

export function calculateAverageDonation(totalRaised: number, donationCount: number): number {
  if (donationCount <= 0) {
    return 0;
  }

  return roundAmount(totalRaised / donationCount);
}

export function buildDonationTypeDistribution(
  rows: Array<{
    donationType: DonationType;
    count: number;
    totalAmount: number;
  }>,
  donationCount: number
): DonationTypeDistribution {
  const distribution: DonationTypeDistribution = {
    oneTime: {
      count: 0,
      totalAmount: 0,
      sharePercent: 0
    },
    recurring: {
      count: 0,
      totalAmount: 0,
      sharePercent: 0
    }
  };

  for (const row of rows) {
    const target = row.donationType === DonationType.RECURRING ? distribution.recurring : distribution.oneTime;
    target.count = row.count;
    target.totalAmount = roundAmount(row.totalAmount);
    target.sharePercent = calculateSharePercent(row.count, donationCount);
  }

  return distribution;
}

export function buildAnonymitySplit(
  rows: Array<{
    isAnonymous: boolean;
    count: number;
  }>,
  donationCount: number
): DonationAnonymitySplit {
  let anonymousCount = 0;
  let namedCount = 0;

  for (const row of rows) {
    if (row.isAnonymous) {
      anonymousCount = row.count;
    } else {
      namedCount = row.count;
    }
  }

  return {
    anonymousCount,
    namedCount,
    anonymousSharePercent: calculateSharePercent(anonymousCount, donationCount),
    namedSharePercent: calculateSharePercent(namedCount, donationCount)
  };
}

export function buildDailyDonationSeries(
  donations: Array<{
    createdAt: Date;
    amount: number;
  }>,
  goalAmount: number
): AnalyticsTimeSeriesPoint[] {
  if (donations.length === 0) {
    return [];
  }

  const totalsByDay = new Map<string, { donationCount: number; totalAmount: number }>();

  for (const donation of donations) {
    const dateKey = formatUtcDateKey(donation.createdAt);
    const entry = totalsByDay.get(dateKey) ?? {
      donationCount: 0,
      totalAmount: 0
    };

    entry.donationCount += 1;
    entry.totalAmount += donation.amount;
    totalsByDay.set(dateKey, entry);
  }

  const firstDate = parseUtcDateKey(formatUtcDateKey(donations[0].createdAt));
  const lastDate = parseUtcDateKey(formatUtcDateKey(donations[donations.length - 1].createdAt));
  const series: AnalyticsTimeSeriesPoint[] = [];
  let cursor = firstDate;
  let cumulativeAmount = 0;

  while (cursor.getTime() <= lastDate.getTime()) {
    const dateKey = formatUtcDateKey(cursor);
    const entry = totalsByDay.get(dateKey) ?? {
      donationCount: 0,
      totalAmount: 0
    };

    cumulativeAmount += entry.totalAmount;

    series.push({
      dateKey,
      label: formatDayLabel(dateKey),
      donationCount: entry.donationCount,
      totalAmount: roundAmount(entry.totalAmount),
      cumulativeAmount: roundAmount(cumulativeAmount),
      cumulativePercent: calculateProgressPercent(cumulativeAmount, goalAmount)
    });

    cursor = addUtcDays(cursor, 1);
  }

  return series;
}

function getDefaultAnalyticsPersistence(): AnalyticsServicePersistence {
  return {
    getCampaignAnalyticsData: getCampaignAnalyticsQueryData,
    getPlatformAnalyticsData: getPlatformAnalyticsQueryData
  };
}

export async function getCampaignAnalytics(
  campaignId: string,
  deps?: {
    persistence?: Pick<AnalyticsServicePersistence, "getCampaignAnalyticsData">;
  }
): Promise<CampaignAnalytics | null> {
  const persistence = deps?.persistence ?? getDefaultAnalyticsPersistence();
  const data = await persistence.getCampaignAnalyticsData(campaignId);

  if (!data) {
    return null;
  }

  const goalAmount = toNumber(data.campaign.goalAmount);
  const totalRaised = roundAmount(toNumber(data.donationSummary._sum.amount));
  const donationCount = data.donationSummary._count._all;
  const activityRows = data.activityRows.map((row) => ({
    createdAt: row.createdAt,
    amount: toNumber(row.amount)
  }));

  return {
    campaignId: data.campaign.id,
    campaignTitle: data.campaign.title,
    campaignStatus: data.campaign.status,
    goalAmount,
    totalRaised,
    donationCount,
    averageDonation: calculateAverageDonation(totalRaised, donationCount),
    progressPercent: calculateProgressPercent(totalRaised, goalAmount),
    donationTypeDistribution: buildDonationTypeDistribution(
      data.donationTypeRows.map((row) => ({
        donationType: row.donationType,
        count: row._count._all,
        totalAmount: toNumber(row._sum.amount)
      })),
      donationCount
    ),
    anonymitySplit: buildAnonymitySplit(
      data.anonymityRows.map((row) => ({
        isAnonymous: row.isAnonymous,
        count: row._count._all
      })),
      donationCount
    ),
    dailySeries: buildDailyDonationSeries(activityRows, goalAmount)
  };
}

export async function getPlatformAnalyticsSummary(
  deps?: {
    persistence?: Pick<AnalyticsServicePersistence, "getPlatformAnalyticsData">;
  }
): Promise<PlatformAnalyticsSummary> {
  const persistence = deps?.persistence ?? getDefaultAnalyticsPersistence();
  const data = await persistence.getPlatformAnalyticsData();
  const totalRaised = roundAmount(toNumber(data.donationSummary._sum.amount));
  const totalDonations = data.donationSummary._count._all;

  return {
    totalCampaigns: data.totalCampaigns,
    totalDonations,
    totalRaised,
    averageDonation: calculateAverageDonation(totalRaised, totalDonations),
    campaignCounts: data.campaignCounts,
    pendingRequestCount: data.pendingRequestCount,
    donationTypeDistribution: buildDonationTypeDistribution(
      data.donationTypeRows.map((row) => ({
        donationType: row.donationType,
        count: row._count._all,
        totalAmount: toNumber(row._sum.amount)
      })),
      totalDonations
    ),
    anonymitySplit: buildAnonymitySplit(
      data.anonymityRows.map((row) => ({
        isAnonymous: row.isAnonymous,
        count: row._count._all
      })),
      totalDonations
    ),
    dailySeries: buildDailyDonationSeries(
      data.activityRows.map((row) => ({
        createdAt: row.createdAt,
        amount: toNumber(row.amount)
      })),
      0
    ),
    topCampaigns: data.campaignMetaRows
      .map((campaign) => {
        const performance = data.campaignPerformanceRows.find((entry) => entry.campaignId === campaign.id);
        const campaignRaised = roundAmount(toNumber(performance?._sum.amount));
        const donationCount = performance?._count._all ?? 0;

        return {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status,
          goalAmount: toNumber(campaign.goalAmount),
          totalRaised: campaignRaised,
          donationCount,
          progressPercent: calculateProgressPercent(campaignRaised, toNumber(campaign.goalAmount)),
          updatedAt: campaign.updatedAt
        };
      })
      .sort((left, right) => {
        if (right.totalRaised !== left.totalRaised) {
          return right.totalRaised - left.totalRaised;
        }

        if (right.donationCount !== left.donationCount) {
          return right.donationCount - left.donationCount;
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, 6),
    quickLinks: data.quickLinks
  };
}
