import { describe, expect, it } from "vitest";
import { mapGlobalDonationBlobs } from "../../lib/domain/landing";

describe("mapGlobalDonationBlobs", () => {
  it("maps donor-selected blob color and campaign image", () => {
    const blobs = mapGlobalDonationBlobs([
      {
        id: "d1",
        amount: 300,
        donorName: "Alex",
        isAnonymous: false,
        donationType: "ONE_TIME",
        blobColor: "#B06BFF",
        donationAccessId: "access-1",
        createdAt: new Date("2026-03-18T10:00:00.000Z"),
        campaignTitle: "Campaign A",
        campaignSlug: "campaign-a",
        campaignImageUrl: "https://example.com/logo.png"
      }
    ]);

    expect(blobs[0].resolvedColorHex).toBe("#B06BFF");
    expect(blobs[0].campaignImageUrl).toBe("https://example.com/logo.png");
    expect(blobs[0].magnetGroupKey).toBe("campaign-a:access-1");
  });

  it("keeps anonymity-safe donor display name", () => {
    const blobs = mapGlobalDonationBlobs([
      {
        id: "d2",
        amount: 500,
        donorName: "Private Donor",
        isAnonymous: true,
        donationType: "ONE_TIME",
        blobColor: null,
        donationAccessId: null,
        createdAt: new Date("2026-03-18T10:00:00.000Z"),
        campaignTitle: "Campaign B",
        campaignSlug: "campaign-b",
        campaignImageUrl: null
      }
    ]);

    expect(blobs[0].donorDisplayName).toBe("Anonymous");
    expect(blobs[0].campaignImageUrl).toBeNull();
    expect(blobs[0].magnetGroupKey).toBeNull();
  });
});
