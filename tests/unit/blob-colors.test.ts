import { describe, expect, it } from "vitest";
import {
  buildBlobSurfaceBackground,
  buildBlobSwatchBackground,
  DONATION_BLOB_COLOR_OPTIONS,
  hasRenderableCampaignImageUrl,
  resolveBlobColor
} from "../../lib/domain/blob-colors";

describe("blob color palette", () => {
  it("uses a curated 16-color palette", () => {
    expect(DONATION_BLOB_COLOR_OPTIONS).toHaveLength(16);
  });

  it("falls back to palette color when color is missing", () => {
    expect(resolveBlobColor(null, 2)).toBe(DONATION_BLOB_COLOR_OPTIONS[2].value);
  });

  it("builds stable gradient strings for swatches and blob surfaces", () => {
    const swatch = buildBlobSwatchBackground("#4DD2FF");
    const surface = buildBlobSurfaceBackground("#4DD2FF");

    expect(swatch).toContain("radial-gradient");
    expect(surface).toContain("radial-gradient");
  });

  it("accepts only renderable http/https campaign image URLs", () => {
    expect(hasRenderableCampaignImageUrl("https://example.com/logo.png")).toBe(true);
    expect(hasRenderableCampaignImageUrl("http://example.com/logo.jpg")).toBe(true);
    expect(hasRenderableCampaignImageUrl("not-a-url")).toBe(false);
    expect(hasRenderableCampaignImageUrl("")).toBe(false);
    expect(hasRenderableCampaignImageUrl(null)).toBe(false);
  });
});
