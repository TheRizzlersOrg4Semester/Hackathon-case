import type { DonationType } from "@prisma/client";
import { getPublicDonorDisplayName } from "@/lib/domain/campaigns";

export type PublicDonationData = {
  id: string;
  amount: number;
  donorName: string | null;
  isAnonymous: boolean;
  donationType: DonationType;
  createdAt: Date;
};

export type DonorBlob = {
  id: string;
  donorDisplayName: string;
  amount: number;
  donationType: DonationType;
  createdAt: Date;
  sizePx: number;
  colorClass: string;
};

const MIN_SIZE = 52;
const MAX_SIZE = 128;
const BLOB_COLORS = ["blob-a", "blob-b", "blob-c", "blob-d"];

export function calculateBlobSize(amount: number, minAmount: number, maxAmount: number): number {
  if (amount <= 0) {
    return MIN_SIZE;
  }

  if (minAmount >= maxAmount) {
    return Math.round((MIN_SIZE + MAX_SIZE) / 2);
  }

  const ratio = (amount - minAmount) / (maxAmount - minAmount);
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return Math.round(MIN_SIZE + clampedRatio * (MAX_SIZE - MIN_SIZE));
}

export function mapDonationsToBlobs(donations: PublicDonationData[]): DonorBlob[] {
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
    sizePx: calculateBlobSize(donation.amount, minAmount, maxAmount),
    colorClass: BLOB_COLORS[index % BLOB_COLORS.length]
  }));
}
