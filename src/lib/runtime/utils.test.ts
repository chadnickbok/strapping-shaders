import { describe, expect, it } from "vitest";
import { normalizeSeed, qualityToScale } from "./utils";

describe("runtime utils", () => {
  it("normalizes numeric and string seeds deterministically", () => {
    expect(normalizeSeed(42)).toBe(normalizeSeed(42));
    expect(normalizeSeed("ghost-frame-demo")).toBe(normalizeSeed("ghost-frame-demo"));
    expect(normalizeSeed("ghost-frame-demo")).not.toBe(normalizeSeed("aurora-demo"));
  });

  it("chooses lower auto scales for larger frames", () => {
    expect(qualityToScale("auto", 320, 180)).toBe(1);
    expect(qualityToScale("auto", 1440, 900)).toBeLessThan(1);
    expect(qualityToScale("low", 320, 180)).toBeLessThan(qualityToScale("medium", 320, 180));
  });
});
