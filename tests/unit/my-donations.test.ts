import { describe, expect, it } from "vitest";
import { lookupMyDonationsBySupporterAccessCode } from "../../lib/services/my-donations";

describe("lookupMyDonationsBySupporterAccessCode", () => {
  it("returns donations and receipt metadata for a valid code", async () => {
    const result = await lookupMyDonationsBySupporterAccessCode(
      { supporterAccessCode: "pf-ab12-cd34" },
      {
        persistence: {
          async getDonationAccessByCode() {
            return {
              id: "access-1",
              accessCode: "PF-AB12-CD34",
              donations: [
                {
                  id: "donation-1",
                  amount: 250,
                  donationType: "ONE_TIME",
                  isAnonymous: true,
                  donorName: "Should not be public",
                  donorEmail: "private@example.com",
                  blobColor: "#4DD2FF",
                  createdAt: new Date("2026-03-18T10:00:00.000Z"),
                  campaign: {
                    id: "campaign-1",
                    title: "Campaign A"
                  },
                  receipt: {
                    receiptNumber: "RCPT-20260318-123456",
                    issuedAt: new Date("2026-03-18T10:00:01.000Z")
                  }
                }
              ]
            };
          }
        }
      }
    );

    expect(result.supporterAccessCode).toBe("PF-AB12-CD34");
    expect(result.donations).toHaveLength(1);
    expect(result.donations[0].receiptNumber).toBe("RCPT-20260318-123456");
    expect(result.donations[0].campaignTitle).toBe("Campaign A");
  });

  it("throws when access code format is invalid", async () => {
    await expect(
      lookupMyDonationsBySupporterAccessCode(
        { supporterAccessCode: "bad-code" },
        {
          persistence: {
            async getDonationAccessByCode() {
              return null;
            }
          }
        }
      )
    ).rejects.toThrow("Supporter Access Code format is invalid.");
  });

  it("throws when access code does not exist", async () => {
    await expect(
      lookupMyDonationsBySupporterAccessCode(
        { supporterAccessCode: "PF-AB12-CD34" },
        {
          persistence: {
            async getDonationAccessByCode() {
              return null;
            }
          }
        }
      )
    ).rejects.toThrow("Supporter Access Code was not found.");
  });
});
