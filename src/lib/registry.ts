import type { EffectDefinition, EffectId } from "./types";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { causticPoolDefinition, type CausticPoolParams } from "./effects/causticPool";
import { buttonEmitterAuraDefinition, type ButtonEmitterAuraParams } from "./effects/buttonEmitterAura";
import { buttonGhostWhoosh2Definition, type ButtonGhostWhoosh2Params } from "./effects/buttonGhostWhoosh2";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { ghostWhooshButtonDefinition, type GhostWhooshButtonParams } from "./effects/ghostWhooshButton";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";
import { voronoiCausticsDefinition, type VoronoiCausticsParams } from "./effects/voronoiCaustics";

export type EffectParamsById = {
  "aurora-field": AuroraFieldParams;
  "caustic-pool": CausticPoolParams;
  "voronoi-caustics": VoronoiCausticsParams;
  "liquid-distortion": LiquidDistortionParams;
  "ghost-frame": GhostFrameParams;
  "button-emitter-aura": ButtonEmitterAuraParams;
  "button-ghost-whoosh": ButtonGhostWhoosh2Params;
  "ghost-whoosh-button": GhostWhooshButtonParams;
  "pulse-trace-border": PulseTraceBorderParams;
};

export type EffectDefinitionMap = {
  [Key in EffectId]: EffectDefinition<EffectParamsById[Key]>;
};

export const effectRegistry: EffectDefinitionMap = {
  "aurora-field": auroraFieldDefinition,
  "caustic-pool": causticPoolDefinition,
  "voronoi-caustics": voronoiCausticsDefinition,
  "liquid-distortion": liquidDistortionDefinition,
  "ghost-frame": ghostFrameDefinition,
  "button-emitter-aura": buttonEmitterAuraDefinition,
  "button-ghost-whoosh": buttonGhostWhoosh2Definition,
  "ghost-whoosh-button": ghostWhooshButtonDefinition,
  "pulse-trace-border": pulseTraceBorderDefinition
};

export const effectOrder: EffectId[] = [
  "aurora-field",
  "caustic-pool",
  "voronoi-caustics",
  "liquid-distortion",
  "ghost-frame",
  "button-emitter-aura",
  "button-ghost-whoosh",
  "ghost-whoosh-button",
  "pulse-trace-border"
];

export function getEffectDefinition(effectId: EffectId) {
  return effectRegistry[effectId];
}
