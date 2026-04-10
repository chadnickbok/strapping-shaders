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
});
