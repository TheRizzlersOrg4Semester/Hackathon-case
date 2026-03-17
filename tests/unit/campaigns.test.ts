import { describe, expect, it } from "vitest";
import { calculateCampaignProgress, getPublicDonorDisplayName } from "../../lib/domain/campaigns";

describe("calculateCampaignProgress", () => {
  it("calculates raised amount, donor count, and percentage", () => {
    const result = calculateCampaignProgress(1000, [{ amount: 250 }, { amount: 150 }, { amount: 100 }]);

    expect(result.raisedAmount).toBe(500);
    expect(result.donorCount).toBe(3);
    expect(result.percent).toBe(50);
  });

  it("caps progress at 100 percent", () => {
    const result = calculateCampaignProgress(400, [{ amount: 400 }, { amount: 100 }]);

    expect(result.percent).toBe(100);
  });
});

describe("getPublicDonorDisplayName", () => {
  it("returns Anonymous when donation is marked anonymous", () => {
    const name = getPublicDonorDisplayName({
      isAnonymous: true,
      donorName: "Internal Donor Name"
    });

    expect(name).toBe("Anonymous");
  });

  it("returns donor name when non-anonymous and name is present", () => {
    const name = getPublicDonorDisplayName({
      isAnonymous: false,
      donorName: "Mia Christensen"
    });

    expect(name).toBe("Mia Christensen");
  });

  it("returns Guest donor when name is missing and non-anonymous", () => {
    const name = getPublicDonorDisplayName({
      isAnonymous: false,
      donorName: null
    });

    expect(name).toBe("Guest donor");
  });

  it("returns Guest donor when name is blank and non-anonymous", () => {
    const name = getPublicDonorDisplayName({
      isAnonymous: false,
      donorName: "   "
    });

    expect(name).toBe("Guest donor");
  });
});
