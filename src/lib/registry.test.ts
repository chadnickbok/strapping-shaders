import { describe, expect, it } from "vitest";
import { effectRegistry } from "./registry";

describe("effect registry", () => {
  it("clamps aurora params and falls back to the default palette when invalid", () => {
    const params = effectRegistry["aurora-field"].sanitizeParams({
      density: 2,
      flow: -1,
      palette: ["#ffffff", "#000000"]
    });

    expect(params.density).toBe(1);
    expect(params.flow).toBe(0);
    expect(params.palette).toEqual(effectRegistry["aurora-field"].defaults.palette);
  });

  it("clamps liquid distortion params into the documented range", () => {
    const params = effectRegistry["liquid-distortion"].sanitizeParams({
      distortion: -1,
      refraction: 99,
      featureSize: -3,
      highlight: 8
    });

    expect(params.distortion).toBe(0);
    expect(params.refraction).toBe(1);
    expect(params.featureSize).toBe(0);
    expect(params.highlight).toBe(1);
  });

  it("ignores legacy liquid distortion parameter names", () => {
    const params = effectRegistry["liquid-distortion"].sanitizeParams({
      shimmer: 1,
      scale: 0,
      edgeFade: 1
    } as Record<string, unknown>);

    expect(params.motion).toBe(effectRegistry["liquid-distortion"].defaults.motion);
    expect(params.featureSize).toBe(effectRegistry["liquid-distortion"].defaults.featureSize);
    expect(params.edgeStability).toBe(effectRegistry["liquid-distortion"].defaults.edgeStability);
  });

  it("preserves ghost frame tint while constraining shared border params", () => {
    const params = effectRegistry["ghost-frame"].sanitizeParams({
      thicknessPx: 100,
      cornerRadiusPx: 160,
      insetPx: -40,
      tint: "#abcdef"
    });

    expect(params.thicknessPx).toBe(64);
    expect(params.cornerRadiusPx).toBe(120);
    expect(params.insetPx).toBe(-32);
    expect(params.tint).toBe("#abcdef");
  });

  it("rounds pulse trace packet count and preserves the accent tint", () => {
    const params = effectRegistry["pulse-trace-border"].sanitizeParams({
      packetCount: 4.6,
      trailLength: -1,
      accentTint: "#fedcba"
    });

    expect(params.packetCount).toBe(5);
    expect(params.trailLength).toBe(0);
    expect(params.accentTint).toBe("#fedcba");
  });
});
