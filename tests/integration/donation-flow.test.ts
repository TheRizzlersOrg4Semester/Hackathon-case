import { describe, expect, it } from "vitest";
import { DonationType, EmailStatus, Prisma, ThankYouTier } from "@prisma/client";
import { createDonationWithSimulatedPayment, type DonationFlowPersistence } from "../../lib/services/donations";

describe("createDonationWithSimulatedPayment", () => {
  it("creates donation, receipt, and thank-you action for a valid donation", async () => {
    const calls: Array<{ op: string; payload: unknown }> = [];

    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        calls.push({ op: "getPublishedCampaignById", payload: null });
        return { id: "campaign-1" };
      },
      async createDonation(data) {
        calls.push({ op: "createDonation", payload: data });
        return {
          id: "donation-1",
          amount: new Prisma.Decimal(data.amount)
        };
      },
      async createDonationReceipt(data) {
        calls.push({ op: "createDonationReceipt", payload: data });
      },
      async createThankYouAction(data) {
        calls.push({ op: "createThankYouAction", payload: data });
      }
    };

    const result = await createDonationWithSimulatedPayment(
      {
        campaignId: "campaign-1",
        amount: 250,
        donationType: "ONE_TIME",
        isAnonymous: true,
        donorName: "Internal Donor",
        donorEmail: "internal@example.com"
      },
      {
        persistence,
        now: () => new Date("2026-03-17T10:30:00.000Z"),
        randomDigits: () => "654321"
      }
    );

    expect(result.receiptNumber).toBe("RCPT-20260317-654321");
    expect(result.paymentReference).toBe("SIM-1773743400000-654321");
    expect(result.thankYouTier).toBe(ThankYouTier.PERSONAL);

    expect(calls[1]).toEqual({
      op: "createDonation",
      payload: {
        campaignId: "campaign-1",
        amount: 250,
        donationType: DonationType.ONE_TIME,
        isAnonymous: true,
        donorName: "Internal Donor",
        donorEmail: "internal@example.com"
      }
    });

    expect(calls[2]).toEqual({
      op: "createDonationReceipt",
      payload: {
        donationId: "donation-1",
        receiptNumber: "RCPT-20260317-654321",
        totalAmount: new Prisma.Decimal(250)
      }
    });

    expect(calls[3]).toEqual({
      op: "createThankYouAction",
      payload: {
        donationId: "donation-1",
        tier: ThankYouTier.PERSONAL,
        emailStatus: EmailStatus.PENDING
      }
    });
  });

  it("fails when campaign is not published", async () => {
    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        return null;
      },
      async createDonation() {
        throw new Error("should not run");
      },
      async createDonationReceipt() {
        throw new Error("should not run");
      },
      async createThankYouAction() {
        throw new Error("should not run");
      }
    };

    await expect(
      createDonationWithSimulatedPayment(
        {
          campaignId: "missing-campaign",
          amount: 100,
          donationType: "ONE_TIME",
          isAnonymous: false
        },
        { persistence }
      )
    ).rejects.toThrow("Campaign is not available for donations.");
  });
});
