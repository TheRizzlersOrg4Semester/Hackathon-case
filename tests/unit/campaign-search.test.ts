import { describe, expect, it } from "vitest";
import { buildPublishedCampaignSearchWhere } from "../../lib/persistence/campaign-queries";

describe("buildPublishedCampaignSearchWhere", () => {
  it("returns the default published filter when query is empty", () => {
    expect(buildPublishedCampaignSearchWhere("   ")).toEqual({
      status: "PUBLISHED"
    });
  });

  it("builds a published search filter across campaign fields and category name", () => {
    expect(buildPublishedCampaignSearchWhere("health")).toEqual({
      status: "PUBLISHED",
      OR: [
        {
          title: {
            contains: "health",
            mode: "insensitive"
          }
        },
        {
          summary: {
            contains: "health",
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: "health",
            mode: "insensitive"
          }
        },
        {
          category: {
            is: {
              name: {
                contains: "health",
                mode: "insensitive"
              }
            }
          }
        }
      ]
    });
  });
});
