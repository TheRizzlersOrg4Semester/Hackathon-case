import { describe, expect, it, vi } from "vitest";
import { CampaignStatus } from "@prisma/client";
import { assertCampaignStatusTransition, canTransitionCampaignStatus } from "../../lib/domain/campaign-admin";
import {
  deleteDonationByAdmin,
  transitionCampaignStatusByAdmin,
  type CampaignAdminPersistence
} from "../../lib/services/admin-campaigns";

describe("campaign status transitions", () => {
  it("allows DRAFT to PUBLISHED and PUBLISHED to CLOSED", () => {
    expect(canTransitionCampaignStatus("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransitionCampaignStatus("PUBLISHED", "CLOSED")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionCampaignStatus("DRAFT", "CLOSED")).toBe(false);
    expect(canTransitionCampaignStatus("CLOSED", "PUBLISHED")).toBe(false);
    expect(() => assertCampaignStatusTransition("CLOSED", "PUBLISHED")).toThrow(
      "Campaign cannot transition from CLOSED to PUBLISHED."
    );
  });

  it("updates publish dates when publishing", async () => {
    const updateCampaignStatus = vi.fn(async () => undefined);

    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        return { id: "campaign-1", status: CampaignStatus.DRAFT };
      },
      async createCampaign() {
        throw new Error("not used");
      },
      async updateCampaign() {
        throw new Error("not used");
      },
      updateCampaignStatus,
      async deleteDonationById() {
        throw new Error("not used");
      }
    };

    const now = new Date("2026-03-18T09:00:00.000Z");

    await transitionCampaignStatusByAdmin("campaign-1", CampaignStatus.PUBLISHED, {
      persistence,
      now: () => now
    });

    expect(updateCampaignStatus).toHaveBeenCalledWith("campaign-1", CampaignStatus.PUBLISHED, {
      publishedAt: now,
      closedAt: undefined
    });
  });
});

describe("admin donation deletion", () => {
  it("deletes a donation when it exists", async () => {
    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        throw new Error("not used");
      },
      async createCampaign() {
        throw new Error("not used");
      },
      async updateCampaign() {
        throw new Error("not used");
      },
      async updateCampaignStatus() {
        throw new Error("not used");
      },
      async deleteDonationById() {
        return true;
      }
    };

    await expect(deleteDonationByAdmin("donation-1", { persistence })).resolves.toBeUndefined();
  });

  it("throws when donation is missing", async () => {
    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        throw new Error("not used");
      },
      async createCampaign() {
        throw new Error("not used");
      },
      async updateCampaign() {
        throw new Error("not used");
      },
      async updateCampaignStatus() {
        throw new Error("not used");
      },
      async deleteDonationById() {
        return false;
      }
    };

    await expect(deleteDonationByAdmin("missing-donation", { persistence })).rejects.toThrow("Donation not found.");
  });
});
