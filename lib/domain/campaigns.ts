export type DonationFeedItem = {
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  isAnonymous: boolean;
  createdAt: Date;
};

export type CampaignProgress = {
  raisedAmount: number;
  goalAmount: number;
  percent: number;
  donorCount: number;
};

export function calculateCampaignProgress(goalAmount: number, donations: Array<{ amount: number }>): CampaignProgress {
  const raisedAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const rawPercent = goalAmount <= 0 ? 0 : (raisedAmount / goalAmount) * 100;
  const percent = Math.max(0, Math.min(100, Number(rawPercent.toFixed(1))));

  return {
    raisedAmount,
    goalAmount,
    percent,
    donorCount: donations.length
  };
}

export function getPublicDonorDisplayName(donation: Pick<DonationFeedItem, "isAnonymous" | "donorName">): string {
  if (donation.isAnonymous) {
    return "Anonymous";
  }

  if (donation.donorName && donation.donorName.trim().length > 0) {
    return donation.donorName;
  }

  return "Guest donor";
}
