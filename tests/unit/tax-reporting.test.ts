import { Prisma, TaxIdType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getAnnualTaxReport } from "../../lib/services/tax-reporting";

describe("getAnnualTaxReport", () => {
  it("groups tax-eligible donations by tax id within a year", async () => {
    const report = await getAnnualTaxReport(2026, {
      getDonationsForYear: async () => [
        {
          amount: new Prisma.Decimal(300),
          createdAt: new Date("2026-03-18T10:00:00.000Z"),
          taxId: "1234567890",
          taxIdType: TaxIdType.CPR
        },
        {
          amount: new Prisma.Decimal(500),
          createdAt: new Date("2026-06-01T09:00:00.000Z"),
          taxId: "1234567890",
          taxIdType: TaxIdType.CPR
        },
        {
          amount: new Prisma.Decimal(700),
          createdAt: new Date("2026-07-01T09:00:00.000Z"),
          taxId: "55667788",
          taxIdType: TaxIdType.CVR
        }
      ]
    });

    expect(report.totalEligibleAmount).toBe(1500);
    expect(report.entries).toEqual([
      {
        year: 2026,
        taxId: "1234567890",
        taxIdType: TaxIdType.CPR,
        donationCount: 2,
        totalAmount: 800
      },
      {
        year: 2026,
        taxId: "55667788",
        taxIdType: TaxIdType.CVR,
        donationCount: 1,
        totalAmount: 700
      }
    ]);
  });
});
