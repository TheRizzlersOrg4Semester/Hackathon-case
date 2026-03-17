import { getPublicDonorDisplayName } from "@/lib/domain/campaigns";

export type LandingDonation = {
  id: string;
  amount: number;
  donorName: string | null;
  isAnonymous: boolean;
  donationType: "ONE_TIME" | "RECURRING";
  createdAt: Date;
  campaignTitle: string;
  campaignSlug: string;
};

export type LandingCampaign = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  goalAmount: number;
  raisedAmount: number;
  donationCount: number;
  categoryName: string;
};

export type LandingStats = {
  totalRaised: number;
  activeCampaigns: number;
  donorCount: number;
  recurringDonations: number;
};

export type GlobalDonationBlob = {
  id: string;
  donorDisplayName: string;
  amount: number;
  donationType: "ONE_TIME" | "RECURRING";
  createdAt: Date;
  campaignTitle: string;
  campaignSlug: string;
  sizePx: number;
  leftPercent: number;
  topPercent: number;
  colorClass: string;
};

const MIN_BLOB_SIZE = 36;
const MAX_BLOB_SIZE = 124;
const BLOB_COLORS = ["blob-a", "blob-b", "blob-c", "blob-d"];

export function buildLandingStats(campaigns: LandingCampaign[], donations: LandingDonation[]): LandingStats {
  const donorKeys = new Set(
    donations.map((donation) => {
      if (donation.isAnonymous) {
        return `anonymous:${donation.id}`;
      }

      if (donation.donorName && donation.donorName.trim().length > 0) {
        return `name:${donation.donorName.trim().toLowerCase()}`;
      }

      return `donation:${donation.id}`;
    })
  );

  return {
    totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0),
    activeCampaigns: campaigns.length,
    donorCount: donorKeys.size,
    recurringDonations: donations.filter((donation) => donation.donationType === "RECURRING").length
  };
}

function calculateBlobSize(amount: number, minAmount: number, maxAmount: number): number {
  if (minAmount >= maxAmount) {
    return Math.round((MIN_BLOB_SIZE + MAX_BLOB_SIZE) / 2);
  }

  const ratio = (amount - minAmount) / (maxAmount - minAmount);
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(MIN_BLOB_SIZE + clamped * (MAX_BLOB_SIZE - MIN_BLOB_SIZE));
}

export function mapGlobalDonationBlobs(donations: LandingDonation[]): GlobalDonationBlob[] {
  if (donations.length === 0) {
    return [];
  }

  const amounts = donations.map((donation) => donation.amount);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);

  return donations.map((donation, index) => ({
    id: donation.id,
    donorDisplayName: getPublicDonorDisplayName({
      isAnonymous: donation.isAnonymous,
      donorName: donation.donorName
    }),
    amount: donation.amount,
    donationType: donation.donationType,
    createdAt: donation.createdAt,
    campaignTitle: donation.campaignTitle,
    campaignSlug: donation.campaignSlug,
    sizePx: calculateBlobSize(donation.amount, minAmount, maxAmount),
    leftPercent: 6 + ((index * 19) % 84),
    topPercent: 8 + ((index * 31) % 74),
    colorClass: BLOB_COLORS[index % BLOB_COLORS.length]
  }));
}

export function pickFeaturedCampaigns(campaigns: LandingCampaign[]): LandingCampaign[] {
  return [...campaigns]
    .sort((a, b) => {
      const aProgress = a.goalAmount > 0 ? a.raisedAmount / a.goalAmount : 0;
      const bProgress = b.goalAmount > 0 ? b.raisedAmount / b.goalAmount : 0;
      return bProgress - aProgress;
    })
    .slice(0, 3);
}
