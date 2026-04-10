import type { AnyEffectDefinition, EffectComponentProps, EffectId } from "./types";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";
import { getEffectDefinition } from "./registry";
import { EffectCanvas } from "./runtime/EffectCanvas";

export function AuroraField(props: EffectComponentProps<AuroraFieldParams>) {
  return <EffectCanvas definition={auroraFieldDefinition} {...props} />;
}

export function LiquidDistortion(props: EffectComponentProps<LiquidDistortionParams>) {
  return <EffectCanvas definition={liquidDistortionDefinition} {...props} />;
}

export function GhostFrame(props: EffectComponentProps<GhostFrameParams>) {
  return <EffectCanvas definition={ghostFrameDefinition} {...props} />;
}

export function PulseTraceBorder(props: EffectComponentProps<PulseTraceBorderParams>) {
  return <EffectCanvas definition={pulseTraceBorderDefinition} {...props} />;
}

export function ShaderRenderer({
  effectId,
  ...props
}: { effectId: EffectId } & EffectComponentProps<Record<string, unknown>>) {
  return <EffectCanvas definition={getEffectDefinition(effectId) as AnyEffectDefinition} {...props} />;
}
