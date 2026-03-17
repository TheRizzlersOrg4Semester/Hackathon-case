import { describe, expect, it } from "vitest";
import { ThankYouTier } from "@prisma/client";
import { buildReceiptNumber, classifyThankYouTier, validateDonationInput } from "../../lib/services/donations";

describe("classifyThankYouTier", () => {
  it("returns BASIC under 200 DKK", () => {
    expect(classifyThankYouTier(199)).toBe(ThankYouTier.BASIC);
  });

  it("returns PERSONAL for 200 to 1000 DKK", () => {
    expect(classifyThankYouTier(200)).toBe(ThankYouTier.PERSONAL);
    expect(classifyThankYouTier(1000)).toBe(ThankYouTier.PERSONAL);
  });

  it("returns FOLLOW_UP above 1000 DKK", () => {
    expect(classifyThankYouTier(1001)).toBe(ThankYouTier.FOLLOW_UP);
  });
});

describe("buildReceiptNumber", () => {
  it("builds deterministic receipt values from provided date and digits", () => {
    const receipt = buildReceiptNumber(new Date("2026-03-17T12:00:00.000Z"), "123456");
    expect(receipt).toBe("RCPT-20260317-123456");
  });
});

describe("validateDonationInput", () => {
  it("applies defaults and accepts empty optional fields", () => {
    const result = validateDonationInput({
      campaignId: "campaign-1",
      amount: 250,
      donorName: " ",
      donorEmail: ""
    });

    expect(result.amount).toBe(250);
    expect(result.donationType).toBe("ONE_TIME");
    expect(result.isAnonymous).toBe(false);
    expect(result.donorEmail).toBe("");
  });

  it("throws on invalid donor email", () => {
    expect(() =>
      validateDonationInput({
        campaignId: "campaign-1",
        amount: 250,
        donorEmail: "not-an-email"
      })
    ).toThrow("Invalid donor email");
  });
});
