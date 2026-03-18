import { describe, expect, it } from "vitest";
import { calculateBlobSize, mapDonationsToBlobs } from "../../lib/domain/donor-blobs";

describe("calculateBlobSize", () => {
  it("returns midpoint size when all donations have same amount", () => {
    const size = calculateBlobSize(500, 500, 500);
    expect(size).toBe(90);
  });

  it("scales between min and max bounds", () => {
    const min = calculateBlobSize(100, 100, 1000);
    const max = calculateBlobSize(1000, 100, 1000);
    const mid = calculateBlobSize(550, 100, 1000);

    expect(min).toBe(52);
    expect(max).toBe(128);
    expect(mid).toBeGreaterThan(min);
    expect(mid).toBeLessThan(max);
  });
});

describe("mapDonationsToBlobs", () => {
  it("maps anonymous donations to Anonymous display name", () => {
    const blobs = mapDonationsToBlobs([
      {
        id: "d1",
        amount: 300,
        donorName: "Private Donor",
        isAnonymous: true,
        donationType: "ONE_TIME",
        blobColor: "#4DD2FF",
        campaignImageUrl: "https://example.com/campaign.png",
        campaignTitle: "Campaign A",
        createdAt: new Date("2026-03-17T10:00:00Z")
      }
    ]);

    expect(blobs[0].donorDisplayName).toBe("Anonymous");
  });

  it("maps missing donor names to Guest donor when non-anonymous", () => {
    const blobs = mapDonationsToBlobs([
      {
        id: "d2",
        amount: 220,
        donorName: null,
        isAnonymous: false,
        donationType: "RECURRING",
        blobColor: null,
        campaignImageUrl: null,
        campaignTitle: "Campaign B",
        createdAt: new Date("2026-03-17T10:00:00Z")
      }
    ]);

    expect(blobs[0].donorDisplayName).toBe("Guest donor");
  });

  it("uses donor-selected blob color and keeps campaign identity fields", () => {
    const blobs = mapDonationsToBlobs([
      {
        id: "d3",
        amount: 500,
        donorName: "Alex",
        isAnonymous: false,
        donationType: "ONE_TIME",
        blobColor: "#2FD39A",
        campaignImageUrl: "https://example.com/logo.png",
        campaignTitle: "Campaign C",
        createdAt: new Date("2026-03-17T10:00:00Z")
      }
    ]);

    expect(blobs[0].resolvedColorHex).toBe("#2FD39A");
    expect(blobs[0].campaignImageUrl).toBe("https://example.com/logo.png");
    expect(blobs[0].campaignTitle).toBe("Campaign C");
    expect(blobs[0].magnetGroupKey).toBeNull();
  });

  it("builds magnetic group key from campaign and supporter access group", () => {
    const blobs = mapDonationsToBlobs([
      {
        id: "d4",
        amount: 400,
        donorName: "Alex",
        isAnonymous: false,
        donationType: "ONE_TIME",
        blobColor: "#4DD2FF",
        campaignImageUrl: null,
        campaignTitle: "Campaign D",
        accessGroupKey: "access-1",
        campaignScopeKey: "campaign-1",
        createdAt: new Date("2026-03-17T10:00:00Z")
      }
    ]);

    expect(blobs[0].magnetGroupKey).toBe("campaign-1:access-1");
  });
});
