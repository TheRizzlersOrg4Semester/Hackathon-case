import { Prisma, TaxIdType } from "@prisma/client";
import { getTaxEligibleDonationsForYear } from "@/lib/persistence/tax-queries";

export type AnnualTaxDonationSummary = {
  year: number;
  taxId: string;
  taxIdType: TaxIdType;
  donationCount: number;
  totalAmount: number;
};

export type AnnualTaxReport = {
  year: number;
  entries: AnnualTaxDonationSummary[];
  totalEligibleAmount: number;
};

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function roundAmount(value: number): number {
  return Number(value.toFixed(2));
}

export async function getAnnualTaxReport(
  year = new Date().getUTCFullYear(),
  deps?: {
    getDonationsForYear?: typeof getTaxEligibleDonationsForYear;
  }
): Promise<AnnualTaxReport> {
  const getDonationsForYear = deps?.getDonationsForYear ?? getTaxEligibleDonationsForYear;
  const donations = await getDonationsForYear(year);
  const grouped = new Map<string, AnnualTaxDonationSummary>();

  for (const donation of donations) {
    if (!donation.taxId || !donation.taxIdType) {
      continue;
    }

    const key = `${donation.taxIdType}:${donation.taxId}`;
    const existing = grouped.get(key) ?? {
      year,
      taxId: donation.taxId,
      taxIdType: donation.taxIdType,
      donationCount: 0,
      totalAmount: 0
    };

    existing.donationCount += 1;
    existing.totalAmount += toNumber(donation.amount);
    grouped.set(key, existing);
  }

  const entries = [...grouped.values()]
    .map((entry) => ({
      ...entry,
      totalAmount: roundAmount(entry.totalAmount)
    }))
    .sort((left, right) => {
      if (right.totalAmount !== left.totalAmount) {
        return right.totalAmount - left.totalAmount;
      }

      return left.taxId.localeCompare(right.taxId);
    });

  return {
    year,
    entries,
    totalEligibleAmount: roundAmount(entries.reduce((sum, entry) => sum + entry.totalAmount, 0))
  };
}
