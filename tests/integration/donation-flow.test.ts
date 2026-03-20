import { describe, expect, it, vi } from "vitest";
import { CampaignStatus, DonationType, EmailStatus, Prisma, ThankYouTier } from "@prisma/client";
import { createDonationWithSimulatedPayment, type DonationFlowPersistence } from "../../lib/services/donations";

describe("createDonationWithSimulatedPayment", () => {
  it("creates donation, receipt, and thank-you action for a valid first-time donation", async () => {
    const calls: Array<{ op: string; payload: unknown }> = [];
    const thankYouEmailStatusUpdates: Array<{ donationId: string; emailStatus: EmailStatus; triggeredAt: Date | null }> = [];

    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        calls.push({ op: "getPublishedCampaignById", payload: null });
        return {
          id: "campaign-1",
          title: "Campaign One",
          summary: "Help launch the campaign.",
          goalAmount: new Prisma.Decimal(250),
          status: CampaignStatus.PUBLISHED,
          completedAt: null
        };
      },
      async findDonationAccessByCode(code) {
        calls.push({ op: "findDonationAccessByCode", payload: code });
        return null;
      },
      async createDonationAccess(accessCode) {
        calls.push({ op: "createDonationAccess", payload: accessCode });
        return {
          id: "access-1",
          accessCode
        };
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
      },
      async markCampaignCompleted(campaignId, completedAt) {
        calls.push({ op: "markCampaignCompleted", payload: { campaignId, completedAt } });
      },
      async getCampaignRaisedAmount() {
        return new Prisma.Decimal(250);
      }
    };

    const result = await createDonationWithSimulatedPayment(
      {
        campaignId: "campaign-1",
        amount: 250,
        donationType: "ONE_TIME",
        isAnonymous: true,
        donorName: "Internal Donor",
        donorEmail: "internal@example.com",
        blobColor: "#4DD2FF",
        accessCodeMode: "CREATE_NEW",
        paymentCardholderName: "Internal Donor",
        paymentCardNumber: "4242 4242 4242 4242",
        paymentExpiryMonth: 8,
        paymentExpiryYear: 2099,
        paymentCvc: "123",
        paymentBillingPostalCode: "2100"
      },
      {
        persistence,
        now: () => new Date("2026-03-17T10:30:00.000Z"),
        randomDigits: () => "654321",
        randomFloat: () => 0,
        sendThankYouEmail: async () => ({
          status: "triggered",
          message: "Email handed off to Resend.",
          providerMessageId: "email-1"
        }),
        updateThankYouActionStatus: async (data) => {
          thankYouEmailStatusUpdates.push(data);
        }
      }
    );

    expect(result.receiptNumber).toBe("RCPT-20260317-654321");
    expect(result.paymentReference).toBe("SIM-1773743400000-654321");
    expect(result.paymentCardBrand).toBe("Visa");
    expect(result.paymentCardLast4).toBe("4242");
    expect(result.thankYouTier).toBe(ThankYouTier.PERSONAL);
    expect(result.supporterAccessCode).toMatch(/^PF-/);
    expect(result.supporterAccessCodeCreated).toBe(true);
    expect(result.thankYouEmailDelivery.status).toBe("triggered");

    expect(calls).toEqual(
      expect.arrayContaining([
        {
          op: "createDonation",
          payload: {
            campaignId: "campaign-1",
            donationAccessId: "access-1",
            amount: 250,
            donationType: DonationType.ONE_TIME,
            isAnonymous: true,
            donorName: "Internal Donor",
            donorEmail: "internal@example.com",
            taxEligible: false,
            taxIdType: null,
            taxId: null,
            subscribedToUpdates: false,
            blobColor: "#4DD2FF",
            paymentCardholderName: "Internal Donor",
            paymentCardBrand: "Visa",
            paymentCardLast4: "4242",
            paymentExpiryMonth: 8,
            paymentExpiryYear: 2099,
            paymentBillingPostalCode: "2100"
          }
        },
        {
          op: "createDonationReceipt",
          payload: {
            donationId: "donation-1",
            receiptNumber: "RCPT-20260317-654321",
            totalAmount: new Prisma.Decimal(250)
          }
        },
        {
          op: "createThankYouAction",
          payload: {
            donationId: "donation-1",
            tier: ThankYouTier.PERSONAL,
            emailStatus: EmailStatus.PENDING
          }
        },
        {
          op: "markCampaignCompleted",
          payload: {
            campaignId: "campaign-1",
            completedAt: new Date("2026-03-17T10:30:00.000Z")
          }
        }
      ])
    );
    expect(thankYouEmailStatusUpdates).toHaveLength(1);
    expect(thankYouEmailStatusUpdates[0]).toMatchObject({
      donationId: "donation-1",
      emailStatus: EmailStatus.TRIGGERED
    });
  });

  it("reuses an existing supporter access code", async () => {
    let subscribedToUpdates: boolean | null = null;

    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        return {
          id: "campaign-1",
          title: "Campaign One",
          summary: "Help launch the campaign.",
          goalAmount: new Prisma.Decimal(500),
          status: CampaignStatus.PUBLISHED,
          completedAt: null
        };
      },
      async findDonationAccessByCode(code) {
        if (code === "PF-AB12-CD34") {
          return {
            id: "access-1",
            accessCode: code
          };
        }

        return null;
      },
      async createDonationAccess() {
        throw new Error("should not run");
      },
      async createDonation(data) {
        subscribedToUpdates = data.subscribedToUpdates;
        return {
          id: "donation-1",
          amount: new Prisma.Decimal(data.amount)
        };
      },
      async createDonationReceipt() {
        return undefined;
      },
      async createThankYouAction() {
        return undefined;
      },
      async markCampaignCompleted() {
        return undefined;
      },
      async getCampaignRaisedAmount() {
        return new Prisma.Decimal(100);
      }
    };

    const result = await createDonationWithSimulatedPayment(
      {
        campaignId: "campaign-1",
        amount: 100,
        donationType: "ONE_TIME",
        isAnonymous: false,
        subscribedToUpdates: true,
        accessCodeMode: "USE_EXISTING",
        supporterAccessCode: "pf-ab12-cd34",
        paymentCardholderName: "Existing Donor",
        paymentCardNumber: "5555 5555 5555 4444",
        paymentExpiryMonth: 9,
        paymentExpiryYear: 2099,
        paymentCvc: "456"
      },
      { persistence }
    );

    expect(result.supporterAccessCode).toBe("PF-AB12-CD34");
    expect(result.supporterAccessCodeCreated).toBe(false);
    expect(subscribedToUpdates).toBe(true);
  });

  it("fails when campaign is not published", async () => {
    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        return null;
      },
      async findDonationAccessByCode() {
        throw new Error("should not run");
      },
      async createDonationAccess() {
        throw new Error("should not run");
      },
      async createDonation() {
        throw new Error("should not run");
      },
      async createDonationReceipt() {
        throw new Error("should not run");
      },
      async createThankYouAction() {
        throw new Error("should not run");
      },
      async markCampaignCompleted() {
        throw new Error("should not run");
      },
      async getCampaignRaisedAmount() {
        throw new Error("should not run");
      }
    };

    await expect(
      createDonationWithSimulatedPayment(
        {
          campaignId: "missing-campaign",
          amount: 100,
          donationType: "ONE_TIME",
          isAnonymous: false,
          paymentCardholderName: "Missing Campaign Donor",
          paymentCardNumber: "4242 4242 4242 4242",
          paymentExpiryMonth: 8,
          paymentExpiryYear: 2099,
          paymentCvc: "123"
        },
        { persistence }
      )
    ).rejects.toThrow("Campaign is not available for donations.");
  });

  it("does not overwrite completedAt when a campaign is already completed", async () => {
    const markCampaignCompleted = vi.fn(async () => undefined);

    const persistence: DonationFlowPersistence = {
      async getPublishedCampaignById() {
        return {
          id: "campaign-1",
          title: "Campaign One",
          summary: "Help launch the campaign.",
          goalAmount: new Prisma.Decimal(100),
          status: CampaignStatus.PUBLISHED,
          completedAt: new Date("2026-03-16T09:00:00.000Z")
        };
      },
      async findDonationAccessByCode() {
        return null;
      },
      async createDonationAccess(accessCode) {
        return {
          id: "access-1",
          accessCode
        };
      },
      async createDonation(data) {
        return {
          id: "donation-1",
          amount: new Prisma.Decimal(data.amount)
        };
      },
      async createDonationReceipt() {
        return undefined;
      },
      async createThankYouAction() {
        return undefined;
      },
      markCampaignCompleted,
      async getCampaignRaisedAmount() {
        return new Prisma.Decimal(140);
      }
    };

    await createDonationWithSimulatedPayment(
      {
        campaignId: "campaign-1",
        amount: 40,
        donationType: "ONE_TIME",
        isAnonymous: false,
        accessCodeMode: "CREATE_NEW",
        paymentCardholderName: "Repeat Donor",
        paymentCardNumber: "4242 4242 4242 4242",
        paymentExpiryMonth: 8,
        paymentExpiryYear: 2099,
        paymentCvc: "123"
      },
      { persistence, randomFloat: () => 0 }
    );

    expect(markCampaignCompleted).not.toHaveBeenCalled();
  });
});
