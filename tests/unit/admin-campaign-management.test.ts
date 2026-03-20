import { describe, expect, it, vi } from "vitest";
import { CampaignStatus } from "@prisma/client";
import { assertCampaignStatusTransition, canTransitionCampaignStatus } from "../../lib/domain/campaign-admin";
import {
  createCampaignByAdmin,
  deleteDonationByAdmin,
  transitionCampaignStatusByAdmin,
  updateCampaignByAdmin,
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

describe("campaign milestone management", () => {
  it("passes normalized milestones into campaign creation", async () => {
    const createCampaign = vi.fn(async () => ({ id: "campaign-1" }));

    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        throw new Error("not used");
      },
      createCampaign,
      async updateCampaign() {
        throw new Error("not used");
      },
      async updateCampaignStatus() {
        throw new Error("not used");
      },
      async deleteDonationById() {
        throw new Error("not used");
      }
    };

    await createCampaignByAdmin(
      {
        title: "Community Garden",
        slug: "community-garden",
        summary: "Help expand our local garden.",
        description: "Funding adds raised beds, a tool shed, and volunteer workshops for the neighborhood.",
        goalAmount: 15000,
        celebrationEnabled: true,
        milestones: [
          {
            title: "Tool shed",
            description: "Weatherproof storage for equipment.",
            targetAmount: 9000,
            displayOrder: 2
          },
          {
            title: "Raised beds",
            description: "First build phase for the growing area.",
            targetAmount: 5000,
            displayOrder: 1
          }
        ]
      },
      { persistence }
    );

    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        celebrationEnabled: true,
        milestones: [
          {
            title: "Raised beds",
            description: "First build phase for the growing area.",
            targetAmount: 5000,
            displayOrder: 1
          },
          {
            title: "Tool shed",
            description: "Weatherproof storage for equipment.",
            targetAmount: 9000,
            displayOrder: 2
          }
        ]
      })
    );
  });

  it("passes milestone replacements into campaign updates", async () => {
    const updateCampaign = vi.fn(async () => undefined);

    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        throw new Error("not used");
      },
      async createCampaign() {
        throw new Error("not used");
      },
      updateCampaign,
      async updateCampaignStatus() {
        throw new Error("not used");
      },
      async deleteDonationById() {
        throw new Error("not used");
      }
    };

    await updateCampaignByAdmin(
      "campaign-1",
      {
        title: "Community Garden",
        slug: "community-garden",
        summary: "Help expand our local garden.",
        description: "Funding adds raised beds, a tool shed, and volunteer workshops for the neighborhood.",
        goalAmount: 15000,
        celebrationEnabled: false,
        milestones: [
          {
            id: "m-1",
            title: "Raised beds",
            description: "",
            targetAmount: 5000,
            displayOrder: 1
          }
        ]
      },
      { persistence }
    );

    expect(updateCampaign).toHaveBeenCalledWith(
      "campaign-1",
      expect.objectContaining({
        celebrationEnabled: false,
        milestones: [
          {
            title: "Raised beds",
            description: null,
            targetAmount: 5000,
            displayOrder: 1
          }
        ]
      })
    );
  });

  it("keeps celebration enabled by default when omitted", async () => {
    const createCampaign = vi.fn(async () => ({ id: "campaign-1" }));

    const persistence: CampaignAdminPersistence = {
      async getCampaignStatusById() {
        throw new Error("not used");
      },
      createCampaign,
      async updateCampaign() {
        throw new Error("not used");
      },
      async updateCampaignStatus() {
        throw new Error("not used");
      },
      async deleteDonationById() {
        throw new Error("not used");
      }
    };

    await createCampaignByAdmin(
      {
        title: "Celebration Default",
        slug: "celebration-default",
        summary: "Summary with enough detail.",
        description: "Description with enough detail to satisfy validation rules for admin campaign creation.",
        goalAmount: 2000
      },
      { persistence }
    );

    expect(createCampaign).toHaveBeenCalledWith(expect.objectContaining({ celebrationEnabled: true }));
  });
});
