import { DonationType, ThankYouTier } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { buildThankYouEmailContent, sendDonationThankYouEmail } from "../../lib/services/thank-you-emails";

const baseInput = {
  donorEmail: "donor@example.com",
  donorName: "Mia",
  campaignId: "campaign-1",
  campaignTitle: "Community Tree Belt 2026",
  campaignSummary: "Plant and maintain 1,500 urban trees.",
  amount: 750,
  donationType: DonationType.ONE_TIME,
  receiptNumber: "RCPT-20260318-123456",
  paymentReference: "SIM-1773820800000-123456",
  supporterAccessCode: "PF-AB12-CD34",
  supporterAccessCodeCreated: true,
  thankYouTier: ThankYouTier.PERSONAL
};

describe("buildThankYouEmailContent", () => {
  it("includes a campaign update for the personal tier", () => {
    const content = buildThankYouEmailContent(baseInput, "http://localhost:3000");

    expect(content.subject).toContain("Community Tree Belt 2026");
    expect(content.text).toContain("Kampagneopdatering");
    expect(content.text).toContain("simuleret betaling");
    expect(content.html).toContain("/campaigns/campaign-1");
  });

  it("promises dedicated follow-up for the highest tier", () => {
    const content = buildThankYouEmailContent(
      {
        ...baseInput,
        amount: 2500,
        thankYouTier: ThankYouTier.FOLLOW_UP
      },
      "http://localhost:3000"
    );

    expect(content.text).toContain("personligt op");
  });
});

describe("sendDonationThankYouEmail", () => {
  it("skips delivery when Resend is not configured", async () => {
    const result = await sendDonationThankYouEmail(baseInput, {
      apiKey: "",
      fromEmail: ""
    });

    expect(result.status).toBe("skipped");
  });

  it("hands the email off to Resend when configured", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "email-123" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    const result = await sendDonationThankYouEmail(baseInput, {
      apiKey: "re_test",
      fromEmail: "PulseFund <onboarding@resend.dev>",
      baseUrl: "http://localhost:3000",
      fetchImpl
    });

    expect(result).toMatchObject({
      status: "triggered",
      providerMessageId: "email-123"
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
