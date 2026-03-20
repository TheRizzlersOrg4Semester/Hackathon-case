import { CampaignStatus, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getActiveCelebrationCampaign, type CelebrationPersistence } from "../../lib/services/celebrations";

describe("getActiveCelebrationCampaign", () => {
  it("returns the most recently completed eligible campaign", async () => {
    const persistence: CelebrationPersistence = {
      async getCelebrationCandidates() {
        return [
          {
            id: "campaign-older",
            slug: "older",
            title: "Older Success",
            summary: null,
            celebrationEnabled: true,
            status: CampaignStatus.PUBLISHED,
            goalAmount: new Prisma.Decimal(1000),
            completedAt: new Date("2026-03-19T10:00:00.000Z"),
            publishedAt: new Date("2026-03-18T10:00:00.000Z"),
            donations: [{ amount: new Prisma.Decimal(1200) }]
          },
          {
            id: "campaign-latest",
            slug: "latest",
            title: "Latest Success",
            summary: "Most relevant celebration.",
            celebrationEnabled: true,
            status: CampaignStatus.PUBLISHED,
            goalAmount: new Prisma.Decimal(1500),
            completedAt: new Date("2026-03-20T09:00:00.000Z"),
            publishedAt: new Date("2026-03-19T10:00:00.000Z"),
            donations: [{ amount: new Prisma.Decimal(1600) }]
          }
        ];
      }
    };

    await expect(getActiveCelebrationCampaign({ persistence })).resolves.toMatchObject({
      id: "campaign-latest",
      title: "Latest Success",
      raisedAmount: 1600,
      goalAmount: 1500
    });
  });

  it("returns null when no campaign is actually completed", async () => {
    const persistence: CelebrationPersistence = {
      async getCelebrationCandidates() {
        return [
          {
            id: "campaign-disabled-equivalent",
            slug: "not-funded",
            title: "Not Funded Yet",
            summary: null,
            celebrationEnabled: true,
            status: CampaignStatus.PUBLISHED,
            goalAmount: new Prisma.Decimal(5000),
            completedAt: new Date("2026-03-20T09:00:00.000Z"),
            publishedAt: new Date("2026-03-19T10:00:00.000Z"),
            donations: [{ amount: new Prisma.Decimal(3200) }]
          }
        ];
      }
    };

    await expect(getActiveCelebrationCampaign({ persistence })).resolves.toBeNull();
  });

  it("returns null when there are no eligible campaigns", async () => {
    const persistence: CelebrationPersistence = {
      async getCelebrationCandidates() {
        return [];
      }
    };

    await expect(getActiveCelebrationCampaign({ persistence })).resolves.toBeNull();
  });

  it("returns null when a completed campaign has celebration disabled", async () => {
    const persistence: CelebrationPersistence = {
      async getCelebrationCandidates() {
        return [
          {
            id: "campaign-disabled",
            slug: "disabled",
            title: "Disabled Celebration",
            summary: null,
            celebrationEnabled: false,
            status: CampaignStatus.PUBLISHED,
            goalAmount: new Prisma.Decimal(5000),
            completedAt: new Date("2026-03-20T09:00:00.000Z"),
            publishedAt: new Date("2026-03-19T10:00:00.000Z"),
            donations: [{ amount: new Prisma.Decimal(5200) }]
          }
        ];
      }
    };

    await expect(getActiveCelebrationCampaign({ persistence })).resolves.toBeNull();
  });
});
