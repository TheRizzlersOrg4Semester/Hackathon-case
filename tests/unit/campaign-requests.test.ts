import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  reviewCampaignRequest,
  validateCampaignRequestInput,
  type CampaignRequestPersistence
} from "../../lib/services/campaign-requests";

describe("validateCampaignRequestInput", () => {
  it("accepts valid campaign requests", () => {
    const result = validateCampaignRequestInput({
      requesterName: "Nora Pedersen",
      requesterEmail: "nora@example.com",
      title: "Community Makerspace",
      category: "Education",
      summary: "Fund starter tools for a youth makerspace.",
      description: "This request supports tools, safety kits, and weekly mentorship sessions for local students.",
      goalAmount: 50000,
      motivation: "Hands-on learning opportunities are limited in the district."
    });

    expect(result.requesterEmail).toBe("nora@example.com");
    expect(result.goalAmount).toBe(50000);
  });

  it("rejects invalid requester email", () => {
    expect(() =>
      validateCampaignRequestInput({
        requesterName: "Nora Pedersen",
        requesterEmail: "not-an-email",
        title: "Community Makerspace",
        category: "Education",
        summary: "Fund starter tools for a youth makerspace.",
        description: "This request supports tools, safety kits, and weekly mentorship sessions for local students.",
        goalAmount: 50000,
        motivation: "Hands-on learning opportunities are limited in the district."
      })
    ).toThrow();
  });
});

describe("reviewCampaignRequest", () => {
  it("approves pending request and creates draft campaign", async () => {
    const updateCampaignRequestReview = vi.fn(async () => undefined);
    const createDraftCampaignFromRequest = vi.fn(async () => ({ id: "campaign-42" }));

    const persistence: CampaignRequestPersistence = {
      async createCampaignRequest() {
        throw new Error("not used");
      },
      async getCampaignRequestById() {
        return {
          id: "request-1",
          title: "Flood Relief Packs",
          summary: "Support quick-response aid packages.",
          description: "Funding goes to emergency supply kits and volunteer logistics for flood-hit neighborhoods.",
          category: "Health",
          goalAmount: new Prisma.Decimal(80000),
          status: "PENDING"
        };
      },
      async findCategoryIdByLabel() {
        return "category-1";
      },
      async campaignSlugExists() {
        return false;
      },
      createDraftCampaignFromRequest,
      updateCampaignRequestReview
    };

    const now = new Date("2026-03-18T10:00:00.000Z");
    const result = await reviewCampaignRequest(
      {
        requestId: "request-1",
        decision: "APPROVED",
        reviewedById: "admin-1"
      },
      {
        persistence,
        now: () => now
      }
    );

    expect(result.approvedCampaignId).toBe("campaign-42");
    expect(createDraftCampaignFromRequest).toHaveBeenCalled();
    expect(updateCampaignRequestReview).toHaveBeenCalledWith({
      requestId: "request-1",
      status: "APPROVED",
      reviewedAt: now,
      reviewedById: "admin-1",
      approvedCampaignId: "campaign-42"
    });
  });

  it("rejects pending request without creating campaign", async () => {
    const createDraftCampaignFromRequest = vi.fn(async () => ({ id: "campaign-42" }));
    const updateCampaignRequestReview = vi.fn(async () => undefined);

    const persistence: CampaignRequestPersistence = {
      async createCampaignRequest() {
        throw new Error("not used");
      },
      async getCampaignRequestById() {
        return {
          id: "request-1",
          title: "Flood Relief Packs",
          summary: "Support quick-response aid packages.",
          description: "Funding goes to emergency supply kits and volunteer logistics for flood-hit neighborhoods.",
          category: "Health",
          goalAmount: new Prisma.Decimal(80000),
          status: "PENDING"
        };
      },
      async findCategoryIdByLabel() {
        return "category-1";
      },
      async campaignSlugExists() {
        return false;
      },
      createDraftCampaignFromRequest,
      updateCampaignRequestReview
    };

    const result = await reviewCampaignRequest(
      {
        requestId: "request-1",
        decision: "REJECTED"
      },
      { persistence }
    );

    expect(result.approvedCampaignId).toBeNull();
    expect(createDraftCampaignFromRequest).not.toHaveBeenCalled();
    expect(updateCampaignRequestReview).toHaveBeenCalled();
  });

  it("throws if request has already been reviewed", async () => {
    const persistence: CampaignRequestPersistence = {
      async createCampaignRequest() {
        throw new Error("not used");
      },
      async getCampaignRequestById() {
        return {
          id: "request-1",
          title: "Flood Relief Packs",
          summary: "Support quick-response aid packages.",
          description: "Funding goes to emergency supply kits and volunteer logistics for flood-hit neighborhoods.",
          category: "Health",
          goalAmount: new Prisma.Decimal(80000),
          status: "APPROVED"
        };
      },
      async findCategoryIdByLabel() {
        return "category-1";
      },
      async campaignSlugExists() {
        return false;
      },
      async createDraftCampaignFromRequest() {
        return { id: "campaign-42" };
      },
      async updateCampaignRequestReview() {
        return undefined;
      }
    };

    await expect(
      reviewCampaignRequest(
        {
          requestId: "request-1",
          decision: "APPROVED"
        },
        { persistence }
      )
    ).rejects.toThrow("Campaign request has already been reviewed.");
  });
});
