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
        createdAt: new Date("2026-03-17T10:00:00Z")
      }
    ]);

    expect(blobs[0].donorDisplayName).toBe("Guest donor");
  });
});
