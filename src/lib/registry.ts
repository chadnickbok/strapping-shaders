import type { EffectDefinition, EffectId } from "./types";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";

export type EffectParamsById = {
  "aurora-field": AuroraFieldParams;
  "liquid-distortion": LiquidDistortionParams;
  "ghost-frame": GhostFrameParams;
  "pulse-trace-border": PulseTraceBorderParams;
};

export type EffectDefinitionMap = {
  [Key in EffectId]: EffectDefinition<EffectParamsById[Key]>;
};

export const effectRegistry: EffectDefinitionMap = {
  "aurora-field": auroraFieldDefinition,
  "liquid-distortion": liquidDistortionDefinition,
  "ghost-frame": ghostFrameDefinition,
  "pulse-trace-border": pulseTraceBorderDefinition
};

export const effectOrder: EffectId[] = [
  "aurora-field",
  "liquid-distortion",
  "ghost-frame",
  "pulse-trace-border"
];

export function getEffectDefinition(effectId: EffectId) {
  return effectRegistry[effectId];
}
