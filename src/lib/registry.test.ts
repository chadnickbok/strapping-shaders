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

  it("clamps caustic pool controls and falls back to the default tints when invalid", () => {
    const params = effectRegistry["caustic-pool"].sanitizeParams({
      waterTint: "pool-blue",
      lightTint: "sun",
      layerMix: -1,
      distortion: 99,
      waves: -3,
      caustic: 8,
      size: 4,
      openness: -2,
      speed: 4,
      depth: 99,
      halo: 4
    });

    expect(params.waterTint).toBe(effectRegistry["caustic-pool"].defaults.waterTint);
    expect(params.lightTint).toBe(effectRegistry["caustic-pool"].defaults.lightTint);
    expect(params.layerMix).toBe(0);
    expect(params.distortion).toBe(1);
    expect(params.waves).toBe(0);
    expect(params.caustic).toBe(1);
    expect(params.size).toBe(3);
    expect(params.openness).toBe(0);
    expect(params.speed).toBe(1);
    expect(params.depth).toBe(1);
    expect(params.halo).toBe(1);
  });

  it("clamps voronoi caustics controls and falls back to the default tints when invalid", () => {
    const params = effectRegistry["voronoi-caustics"].sanitizeParams({
      waterTint: "pool-blue",
      lightTint: "sun",
      scale: -1,
      lineWidth: 8,
      contrast: -2,
      distortion: 4,
      driftSpeed: -3,
      halo: 7
    });

    expect(params.waterTint).toBe(effectRegistry["voronoi-caustics"].defaults.waterTint);
    expect(params.lightTint).toBe(effectRegistry["voronoi-caustics"].defaults.lightTint);
    expect(params.scale).toBe(0);
    expect(params.lineWidth).toBe(1);
    expect(params.contrast).toBe(0);
    expect(params.distortion).toBe(1);
    expect(params.driftSpeed).toBe(0);
    expect(params.halo).toBe(1);
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

  it("clamps cinematic bokeh and flowing gradient controls into the documented ranges", () => {
    const bokeh = effectRegistry["cinematic-bokeh"].sanitizeParams({
      focus: -2,
      focusSpread: 0,
      aperture: 4,
      bladeCount: 99
    });
    const flowing = effectRegistry["flowing-gradient"].sanitizeParams({
      waveHeight: 4,
      separation: -1,
      grain: 2,
      palette: ["#ffffff"]
    });

    expect(bokeh.focus).toBe(0);
    expect(bokeh.focusSpread).toBe(0.02);
    expect(bokeh.aperture).toBe(1);
    expect(bokeh.bladeCount).toBe(8);
    expect(flowing.waveHeight).toBe(1);
    expect(flowing.separation).toBe(0);
    expect(flowing.grain).toBe(1);
    expect(flowing.palette).toEqual(effectRegistry["flowing-gradient"].defaults.palette);
  });

  it("validates the new material and print shaders", () => {
    const soap = effectRegistry["soap-film-interference"].sanitizeParams({
      baseTint: "bubble",
      opacity: 2
    });
    const acrylic = effectRegistry["frosted-acrylic"].sanitizeParams({
      tint: "glass",
      blur: -1,
      thickness: 4
    });
    const moire = effectRegistry["moire-silk"].sanitizeParams({
      palette: ["#ffffff", "#000000"],
      rotationDeg: 999
    });
    const studio = effectRegistry["studio-dither-fade"].sanitizeParams({
      paperTint: "newsprint",
      fade: -1,
      paperGrain: 4
    });

    expect(soap.baseTint).toBe(effectRegistry["soap-film-interference"].defaults.baseTint);
    expect(soap.opacity).toBe(1);
    expect(acrylic.tint).toBe(effectRegistry["frosted-acrylic"].defaults.tint);
    expect(acrylic.blur).toBe(0);
    expect(acrylic.thickness).toBe(1);
    expect(moire.palette).toEqual(effectRegistry["moire-silk"].defaults.palette);
    expect(moire.rotationDeg).toBe(180);
    expect(studio.paperTint).toBe(effectRegistry["studio-dither-fade"].defaults.paperTint);
    expect(studio.fade).toBe(0);
    expect(studio.paperGrain).toBe(1);
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

  it("clamps button emitter geometry, direction, and advanced controls", () => {
    const params = effectRegistry["button-emitter-aura"].sanitizeParams({
      buttonCenterXPx: -12,
      buttonHeightPx: 0,
      buttonRadiusPx: 900,
      emitRadiusPx: 900,
      directionX: 2,
      directionY: -2,
      directionalBias: 99,
      tintA: "#abc123",
      tintB: "orange",
      burstPhase: 8,
      sourceBias: 99,
      outflowStrength: -1,
      curlStrength: 9,
      detailMix: -1,
      hotspotPower: 9
    });

    expect(params.buttonCenterXPx).toBe(0);
    expect(params.buttonHeightPx).toBe(1);
    expect(params.buttonRadiusPx).toBe(512);
    expect(params.emitRadiusPx).toBe(128);
    expect(params.directionX).toBe(1);
    expect(params.directionY).toBe(-1);
    expect(params.directionalBias).toBe(1);
    expect(params.tintA).toBe("#abc123");
    expect(params.tintB).toBe(effectRegistry["button-emitter-aura"].defaults.tintB);
    expect(params.burstPhase).toBe(1);
    expect(params.sourceBias).toBe(48);
    expect(params.outflowStrength).toBe(0);
    expect(params.curlStrength).toBe(1);
    expect(params.detailMix).toBe(0);
    expect(params.hotspotPower).toBe(4);
  });

  it("clamps button ghost whoosh 2 controls for the center source and under-button plume", () => {
    const params = effectRegistry["button-ghost-whoosh"].sanitizeParams({
      buttonCenterXPx: -4,
      buttonHeightPx: 0,
      noiseScale: 0,
      centerSourceScaleX: 4,
      underHeightPx: -2,
      idleReachPx: 999,
      whooshRadiusPx: 999,
      whooshFrontWidthPx: -1,
      burstPhase: 4,
      driftSpeed: -1,
      detachStartPx: 128,
      detachEndPx: 12,
      interiorOpacity: 9,
      tintB: "mist"
    } as Record<string, unknown>);

    expect(params.buttonCenterXPx).toBe(0);
    expect(params.buttonHeightPx).toBe(1);
    expect(params.noiseScale).toBe(0.01);
    expect(params.centerSourceScaleX).toBe(1);
    expect(params.underHeightPx).toBe(1);
    expect(params.idleReachPx).toBe(256);
    expect(params.whooshRadiusPx).toBe(256);
    expect(params.whooshFrontWidthPx).toBe(1);
    expect(params.burstPhase).toBe(1);
    expect(params.driftSpeed).toBe(0);
    expect(params.detachStartPx).toBe(128);
    expect(params.detachEndPx).toBe(129);
    expect(params.interiorOpacity).toBe(1);
    expect(params.tintB).toBe(effectRegistry["button-ghost-whoosh"].defaults.tintB);
  });

  it("clamps ghost whoosh button controls for the center source and underside burst", () => {
    const params = effectRegistry["ghost-whoosh-button"].sanitizeParams({
      buttonCenterXPx: -4,
      buttonHeightPx: 0,
      noiseScale: 0,
      centerSourceScaleX: 4,
      underHeightPx: -2,
      whooshRadiusPx: 999,
      burstPhase: 4,
      driftSpeed: -1,
      detachStartPx: 48,
      detachEndPx: 12,
      interiorOpacity: 9,
      tintB: "mist",
    } as Record<string, unknown>);

    expect(params.buttonCenterXPx).toBe(0);
    expect(params.buttonHeightPx).toBe(1);
    expect(params.noiseScale).toBe(0.01);
    expect(params.centerSourceScaleX).toBe(1);
    expect(params.underHeightPx).toBe(2);
    expect(params.whooshRadiusPx).toBe(160);
    expect(params.burstPhase).toBe(1);
    expect(params.driftSpeed).toBe(0);
    expect(params.detachStartPx).toBe(48);
    expect(params.detachEndPx).toBe(49);
    expect(params.interiorOpacity).toBe(1);
    expect(params.tintB).toBe(effectRegistry["ghost-whoosh-button"].defaults.tintB);
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

  it("accepts rgba tints for prism refraction and clamps its numeric controls", () => {
    const params = effectRegistry["prism-refraction"].sanitizeParams({
      refraction: 3,
      dispersion: -1,
      tint: "rgba(255, 200, 120, 0.25)"
    });

    expect(params.refraction).toBe(1);
    expect(params.dispersion).toBe(0);
    expect(params.tint).toBe("rgba(255, 200, 120, 0.25)");
  });

  it("validates the thermal bloom select control and falls back to the default palette preset", () => {
    const params = effectRegistry["thermal-bloom"].sanitizeParams({
      palettePreset: "infrared",
      bloom: 2
    } as Record<string, unknown>);

    expect(params.palettePreset).toBe(effectRegistry["thermal-bloom"].defaults.palettePreset);
    expect(params.bloom).toBe(1);
  });

  it("validates dithering mode selection and clamps the hybrid controls", () => {
    const params = effectRegistry.dithering.sanitizeParams({
      mode: "museum",
      pixelScale: -1,
      cameraSwing: 2,
      ballTravel: -4,
      ballSize: 3,
      heroBayerMix: 8,
      refinement: -2,
      soften: 2,
      inkColor: "#cccccc",
      paperColor: "linen"
    } as Record<string, unknown>);

    expect(params.mode).toBe(effectRegistry.dithering.defaults.mode);
    expect(params.pixelScale).toBe(0);
    expect(params.cameraSwing).toBe(1);
    expect(params.ballTravel).toBe(0);
    expect(params.ballSize).toBe(1);
    expect(params.heroBayerMix).toBe(1);
    expect(params.refinement).toBe(0);
    expect(params.soften).toBe(1);
    expect(params.inkColor).toBe("#cccccc");
    expect(params.paperColor).toBe(effectRegistry.dithering.defaults.paperColor);
  });
});
