import auroraNode from "../../../examples/shader-node/aurora-field.default.json";
import ghostFrameNode from "../../../examples/shader-node/ghost-frame.default.json";
import liquidNode from "../../../examples/shader-node/liquid-distortion.default.json";
import auroraPreset from "../../../examples/presets/aurora-field.sunrise.json";
import ghostFramePreset from "../../../examples/presets/ghost-frame.seance-card.json";
import liquidPreset from "../../../examples/presets/liquid-distortion.gentle-distortion.json";
import pulseTraceNode from "../../../examples/shader-node/pulse-trace-border.default.json";
import pulseTracePreset from "../../../examples/presets/pulse-trace-border.arcade-cta.json";
import samplePhotoUrl from "../../../fixtures/images/sample-photo.png";
import { effectRegistry } from "../registry";
import type { EffectId, EffectPreset, ShaderNodePayload } from "../types";

export const fixtureAssets = {
  "fixtures/images/sample-photo.png": samplePhotoUrl
} as const;

export const defaultNodes: Record<EffectId, ShaderNodePayload> = {
  "aurora-field": auroraNode as ShaderNodePayload,
  "ghost-frame": ghostFrameNode as ShaderNodePayload,
  "liquid-distortion": liquidNode as ShaderNodePayload,
  "pulse-trace-border": pulseTraceNode as ShaderNodePayload
};

export const presetsByEffect: Record<EffectId, EffectPreset[]> = {
  "aurora-field": [
    {
      name: "Default",
      effectId: "aurora-field",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["aurora-field"].defaults
    },
    auroraPreset as EffectPreset
  ],
  "ghost-frame": [
    {
      name: "Default",
      effectId: "ghost-frame",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["ghost-frame"].defaults
    },
    {
      name: "Showcase",
      effectId: "ghost-frame",
      description: "Larger frame with inset tuned for the playground preview.",
      params: defaultNodes["ghost-frame"].params
    },
    ghostFramePreset as EffectPreset
  ],
  "liquid-distortion": [
    {
      name: "Default",
      effectId: "liquid-distortion",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["liquid-distortion"].defaults
    },
    liquidPreset as EffectPreset
  ],
  "pulse-trace-border": [
    {
      name: "Default",
      effectId: "pulse-trace-border",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["pulse-trace-border"].defaults
    },
    {
      name: "Showcase",
      effectId: "pulse-trace-border",
      description: "Larger frame with motion tuned for the playground preview.",
      params: defaultNodes["pulse-trace-border"].params
    },
    pulseTracePreset as EffectPreset
  ]
};

export function resolveAssetSource(source: string) {
  return fixtureAssets[source as keyof typeof fixtureAssets] ?? source;
}
