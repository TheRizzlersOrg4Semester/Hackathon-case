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
      donorEmail: "",
      paymentCardholderName: "Jamie Donor",
      paymentCardNumber: "4242 4242 4242 4242",
      paymentExpiryMonth: 8,
      paymentExpiryYear: 2099,
      paymentCvc: "123"
    });

    expect(result.amount).toBe(250);
    expect(result.donationType).toBe("ONE_TIME");
    expect(result.isAnonymous).toBe(false);
    expect(result.donorEmail).toBe("");
    expect(result.accessCodeMode).toBe("CREATE_NEW");
    expect(result.taxEligible).toBe(false);
    expect(result.subscribedToUpdates).toBe(false);
  });

  it("throws on invalid donor email", () => {
    expect(() =>
      validateDonationInput({
        campaignId: "campaign-1",
        amount: 250,
        donorEmail: "not-an-email",
        paymentCardholderName: "Jamie Donor",
        paymentCardNumber: "4242 4242 4242 4242",
        paymentExpiryMonth: 8,
        paymentExpiryYear: 2099,
        paymentCvc: "123"
      })
    ).toThrow("Invalid donor email");
  });

  it("requires tax id details when tax deduction is enabled", () => {
    expect(() =>
      validateDonationInput({
        campaignId: "campaign-1",
        amount: 250,
        taxEligible: true,
        paymentCardholderName: "Jamie Donor",
        paymentCardNumber: "4242 4242 4242 4242",
        paymentExpiryMonth: 8,
        paymentExpiryYear: 2099,
        paymentCvc: "123"
      })
    ).toThrow("Choose CPR or CVR for tax deduction handling.");
  });

  it("accepts tax deduction fields when provided", () => {
    const result = validateDonationInput({
      campaignId: "campaign-1",
      amount: 250,
      taxEligible: true,
      taxIdType: "CPR",
      taxId: " 1234567890 ",
      paymentCardholderName: "Jamie Donor",
      paymentCardNumber: "4242 4242 4242 4242",
      paymentExpiryMonth: 8,
      paymentExpiryYear: 2099,
      paymentCvc: "123"
    });

    expect(result.taxEligible).toBe(true);
    expect(result.taxIdType).toBe("CPR");
    expect(result.taxId).toBe("1234567890");
  });

  it("accepts update opt-in preference", () => {
    const result = validateDonationInput({
      campaignId: "campaign-1",
      amount: 250,
      subscribedToUpdates: true,
      paymentCardholderName: "Jamie Donor",
      paymentCardNumber: "4242 4242 4242 4242",
      paymentExpiryMonth: 8,
      paymentExpiryYear: 2099,
      paymentCvc: "123"
    });

    expect(result.subscribedToUpdates).toBe(true);
  });

  it("throws on invalid card number", () => {
    expect(() =>
      validateDonationInput({
        campaignId: "campaign-1",
        amount: 250,
        paymentCardholderName: "Jamie Donor",
        paymentCardNumber: "4242 4242 4242 4241",
        paymentExpiryMonth: 8,
        paymentExpiryYear: 2099,
        paymentCvc: "123"
      })
    ).toThrow("Card number must contain 12 to 19 valid digits.");
  });
});
