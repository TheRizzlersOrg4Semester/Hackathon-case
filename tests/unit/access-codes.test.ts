import { describe, expect, it } from "vitest";
import {
  generateSupporterAccessCode,
  isSupporterAccessCodeFormatValid,
  normalizeSupporterAccessCode
} from "../../lib/domain/access-codes";

describe("supporter access code domain", () => {
  it("normalizes access codes to uppercase", () => {
    expect(normalizeSupporterAccessCode(" pf-ab12-cd34 ")).toBe("PF-AB12-CD34");
  });

  it("validates expected access code format", () => {
    expect(isSupporterAccessCodeFormatValid("PF-AB12-CD34")).toBe(true);
    expect(isSupporterAccessCodeFormatValid("INVALID")).toBe(false);
  });

  it("generates product-format access codes", () => {
    const code = generateSupporterAccessCode(() => 0.2);
    expect(code).toMatch(/^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});
