import auroraNode from "../../../examples/shader-node/aurora-field.default.json";
import causticPoolNode from "../../../examples/shader-node/caustic-pool.default.json";
import voronoiCausticsNode from "../../../examples/shader-node/voronoi-caustics.default.json";
import buttonEmitterAuraNode from "../../../examples/shader-node/button-emitter-aura.default.json";
import buttonGhostWhooshNode from "../../../examples/shader-node/button-ghost-whoosh.default.json";
import ghostFrameNode from "../../../examples/shader-node/ghost-frame.default.json";
import ghostWhooshButtonNode from "../../../examples/shader-node/ghost-whoosh-button.default.json";
import liquidNode from "../../../examples/shader-node/liquid-distortion.default.json";
import auroraPreset from "../../../examples/presets/aurora-field.sunrise.json";
import causticPoolGalleryPreset from "../../../examples/presets/caustic-pool.gallery-pool.json";
import causticPoolSunShelfPreset from "../../../examples/presets/caustic-pool.sun-shelf.json";
import buttonEmitterAuraFirePreset from "../../../examples/presets/button-emitter-aura.fire-button.json";
import buttonEmitterAuraGhostPreset from "../../../examples/presets/button-emitter-aura.ghost-button.json";
import buttonGhostWhooshPreset from "../../../examples/presets/button-ghost-whoosh.pressure-sweep.json";
import ghostFramePreset from "../../../examples/presets/ghost-frame.seance-card.json";
import ghostWhooshButtonPreset from "../../../examples/presets/ghost-whoosh-button.spectral-cta.json";
import liquidPreset from "../../../examples/presets/liquid-distortion.gentle-distortion.json";
import pulseTraceNode from "../../../examples/shader-node/pulse-trace-border.default.json";
import pulseTracePreset from "../../../examples/presets/pulse-trace-border.arcade-cta.json";
import voronoiCausticsBrightPreset from "../../../examples/presets/voronoi-caustics.bright-lattice.json";
import voronoiCausticsQuietPreset from "../../../examples/presets/voronoi-caustics.quiet-web.json";
import samplePhotoUrl from "../../../fixtures/images/sample-photo.png";
import { effectRegistry } from "../registry";
import type { EffectId, EffectPreset, ShaderNodePayload } from "../types";

export const fixtureAssets = {
  "fixtures/images/sample-photo.png": samplePhotoUrl
} as const;

export const defaultNodes: Record<EffectId, ShaderNodePayload> = {
  "aurora-field": auroraNode as ShaderNodePayload,
  "caustic-pool": causticPoolNode as ShaderNodePayload,
  "voronoi-caustics": voronoiCausticsNode as ShaderNodePayload,
  "button-emitter-aura": buttonEmitterAuraNode as ShaderNodePayload,
  "button-ghost-whoosh": buttonGhostWhooshNode as ShaderNodePayload,
  "ghost-frame": ghostFrameNode as ShaderNodePayload,
  "ghost-whoosh-button": ghostWhooshButtonNode as ShaderNodePayload,
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
  "caustic-pool": [
    {
      name: "Default",
      effectId: "caustic-pool",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["caustic-pool"].defaults
    },
    causticPoolSunShelfPreset as EffectPreset,
    causticPoolGalleryPreset as EffectPreset
  ],
  "voronoi-caustics": [
    {
      name: "Default",
      effectId: "voronoi-caustics",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["voronoi-caustics"].defaults
    },
    voronoiCausticsBrightPreset as EffectPreset,
    voronoiCausticsQuietPreset as EffectPreset
  ],
  "button-emitter-aura": [
    {
      name: "Default",
      effectId: "button-emitter-aura",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["button-emitter-aura"].defaults
    },
    {
      name: "Showcase",
      effectId: "button-emitter-aura",
      description: "Preview-tuned ghost shell with the measured demo button geometry.",
      params: defaultNodes["button-emitter-aura"].params
    },
    buttonEmitterAuraGhostPreset as EffectPreset,
    buttonEmitterAuraFirePreset as EffectPreset
  ],
  "button-ghost-whoosh": [
    {
      name: "Default",
      effectId: "button-ghost-whoosh",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["button-ghost-whoosh"].defaults
    },
    buttonGhostWhooshPreset as EffectPreset
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
  "ghost-whoosh-button": [
    {
      name: "Default",
      effectId: "ghost-whoosh-button",
      description: "Matches the effect definition defaults.",
      params: effectRegistry["ghost-whoosh-button"].defaults
    },
    ghostWhooshButtonPreset as EffectPreset
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
