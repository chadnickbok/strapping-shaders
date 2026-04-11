import { describe, expect, it } from "vitest";
import { effectRegistry } from "../registry";
import { defaultNodes, presetsByEffect } from "./examples";
import {
  applyPresetToState,
  buildShaderNodeFromState,
  coerceSeedInput,
  createPlaygroundState
} from "./state";

describe("playground state", () => {
  it("coerces seed input to numbers when possible", () => {
    expect(coerceSeedInput("42")).toBe(42);
    expect(coerceSeedInput("  demo-seed ")).toBe("demo-seed");
    expect(coerceSeedInput("")).toBeUndefined();
  });

  it("builds a shader node payload from state", () => {
    const state = createPlaygroundState(defaultNodes["liquid-distortion"]);
    state.manualTime = true;
    state.time = 2.4;
    const node = buildShaderNodeFromState(state);

    expect(node.effectId).toBe("liquid-distortion");
    expect(node.exportOverrides?.time).toBe(2.4);
    expect(node.assets?.sourceImage).toBe("fixtures/images/sample-photo.png");
  });

  it("preserves measured button geometry in shader node payloads", () => {
    const state = createPlaygroundState(defaultNodes["button-emitter-aura"]);
    state.params = {
      ...state.params,
      buttonCenterXPx: 301.25,
      buttonCenterYPx: 144.5,
      burstPhase: 0.35
    };
    const node = buildShaderNodeFromState(state);

    expect(node.effectId).toBe("button-emitter-aura");
    expect(node.params).toMatchObject({
      buttonCenterXPx: 301.25,
      buttonCenterYPx: 144.5,
      burstPhase: 0.35
    });
  });

  it("preserves measured button geometry in button ghost whoosh shader node payloads", () => {
    const state = createPlaygroundState(defaultNodes["button-ghost-whoosh"]);
    state.params = {
      ...state.params,
      buttonCenterXPx: 294.75,
      buttonCenterYPx: 152.25,
      burstPhase: 0.42
    };
    const node = buildShaderNodeFromState(state);

    expect(node.effectId).toBe("button-ghost-whoosh");
    expect(node.params).toMatchObject({
      buttonCenterXPx: 294.75,
      buttonCenterYPx: 152.25,
      burstPhase: 0.42
    });
  });

  it("applies presets through the effect sanitizers", () => {
    const state = createPlaygroundState(defaultNodes["ghost-frame"]);
    const preset = presetsByEffect["ghost-frame"][2];
    const nextState = applyPresetToState(state, preset, effectRegistry["ghost-frame"]);

    expect(nextState.params).toEqual(
      effectRegistry["ghost-frame"].sanitizeParams(preset.params)
    );
  });

  it("keeps ghost frame on a showcase demo while exposing strict defaults as a preset", () => {
    expect(defaultNodes["ghost-frame"].frame).toEqual({
      width: 560,
      height: 360
    });
    expect((defaultNodes["ghost-frame"].params as { insetPx: number }).insetPx).toBe(18);
    expect(presetsByEffect["ghost-frame"][0].params).toEqual(effectRegistry["ghost-frame"].defaults);
    expect(presetsByEffect["ghost-frame"][1].name).toBe("Showcase");
  });

  it("keeps caustic pool on its authored hero node, keeps the sample floor image, and exposes water presets", () => {
    expect(defaultNodes["caustic-pool"].frame).toEqual({
      width: 1440,
      height: 900,
      rotation: 0
    });
    expect((defaultNodes["caustic-pool"].params as { depth: number }).depth).toBe(0.52);
    expect((defaultNodes["caustic-pool"].params as { waterTint: string }).waterTint).toBe("#97d7e6");
    expect((defaultNodes["caustic-pool"].params as { openness: number }).openness).toBe(0.18);
    expect(defaultNodes["caustic-pool"].assets).toEqual({
      sourceImage: "fixtures/images/sample-photo.png"
    });
    expect(presetsByEffect["caustic-pool"][0].params).toEqual(effectRegistry["caustic-pool"].defaults);
    expect(presetsByEffect["caustic-pool"][1].name).toBe("Sun Shelf");
    expect(presetsByEffect["caustic-pool"][2].name).toBe("Gallery Pool");
  });

  it("keeps voronoi caustics on its authored hero node and exposes stylized cellular presets", () => {
    expect(defaultNodes["voronoi-caustics"].frame).toEqual({
      width: 1440,
      height: 900,
      rotation: 0
    });
    expect((defaultNodes["voronoi-caustics"].params as { scale: number }).scale).toBe(0.42);
    expect((defaultNodes["voronoi-caustics"].params as { lightTint: string }).lightTint).toBe("#f7fbff");
    expect(presetsByEffect["voronoi-caustics"][0].params).toEqual(effectRegistry["voronoi-caustics"].defaults);
    expect(presetsByEffect["voronoi-caustics"][1].name).toBe("Bright Lattice");
    expect(presetsByEffect["voronoi-caustics"][2].name).toBe("Quiet Web");
  });

  it("keeps button emitter aura on a showcase demo while exposing ghost and fire presets", () => {
    expect(defaultNodes["button-emitter-aura"].frame).toEqual({
      width: 560,
      height: 320
    });
    expect((defaultNodes["button-emitter-aura"].params as { buttonWidthPx: number }).buttonWidthPx).toBe(220);
    expect((defaultNodes["button-emitter-aura"].params as { burstPhase: number }).burstPhase).toBe(0);
    expect(presetsByEffect["button-emitter-aura"][0].params).toEqual(
      effectRegistry["button-emitter-aura"].defaults
    );
    expect(presetsByEffect["button-emitter-aura"][1].name).toBe("Showcase");
    expect(presetsByEffect["button-emitter-aura"][2].name).toBe("Ghost Button");
    expect(presetsByEffect["button-emitter-aura"][3].name).toBe("Fire Button");
  });

  it("keeps button ghost whoosh on its authored demo node and exposes the pressure preset", () => {
    expect(defaultNodes["button-ghost-whoosh"].frame).toEqual({
      width: 560,
      height: 320
    });
    expect((defaultNodes["button-ghost-whoosh"].params as { whooshRadiusPx: number }).whooshRadiusPx).toBe(84);
    expect(presetsByEffect["button-ghost-whoosh"][0].params).toEqual(
      effectRegistry["button-ghost-whoosh"].defaults
    );
    expect(presetsByEffect["button-ghost-whoosh"][1].name).toBe("Pressure Sweep");
  });

  it("keeps ghost whoosh button on its authored demo node and exposes the spectral preset", () => {
    expect(defaultNodes["ghost-whoosh-button"].frame).toEqual({
      width: 560,
      height: 320
    });
    expect((defaultNodes["ghost-whoosh-button"].params as { centerSourceScaleX: number }).centerSourceScaleX).toBe(0.46);
    expect(presetsByEffect["ghost-whoosh-button"][0].params).toEqual(
      effectRegistry["ghost-whoosh-button"].defaults
    );
    expect(presetsByEffect["ghost-whoosh-button"][1].name).toBe("Stored Smoke CTA");
  });

  it("keeps pulse trace border on a showcase demo while exposing strict defaults as a preset", () => {
    expect(defaultNodes["pulse-trace-border"].frame).toEqual({
      width: 520,
      height: 220
    });
    expect((defaultNodes["pulse-trace-border"].params as { packetCount: number }).packetCount).toBe(3);
    expect(presetsByEffect["pulse-trace-border"][0].params).toEqual(
      effectRegistry["pulse-trace-border"].defaults
    );
    expect(presetsByEffect["pulse-trace-border"][1].name).toBe("Showcase");
  });

  it("adds authored defaults and presets for contours and thermal bloom", () => {
    expect(defaultNodes.contours.frame).toEqual({
      width: 1440,
      height: 900,
      rotation: 0
    });
    expect(presetsByEffect.contours[1].name).toBe("Atlas");

    expect(defaultNodes["thermal-bloom"].assets).toEqual({
      sourceImage: "fixtures/images/sample-photo.png"
    });
    expect(presetsByEffect["thermal-bloom"][1].name).toBe("Instrument Readout");
  });
});
