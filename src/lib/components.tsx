import type { AnyEffectDefinition, EffectComponentProps, EffectId } from "./types";
import { GhostWhooshButton } from "./GhostWhooshButton";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { causticPoolDefinition, type CausticPoolParams } from "./effects/causticPool";
import { buttonEmitterAuraDefinition, type ButtonEmitterAuraParams } from "./effects/buttonEmitterAura";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";
import { voronoiCausticsDefinition, type VoronoiCausticsParams } from "./effects/voronoiCaustics";
import { getEffectDefinition } from "./registry";
import { EffectCanvas } from "./runtime/EffectCanvas";

export function AuroraField(props: EffectComponentProps<AuroraFieldParams>) {
  return <EffectCanvas definition={auroraFieldDefinition} {...props} />;
}

export function CausticPool(props: EffectComponentProps<CausticPoolParams>) {
  return <EffectCanvas definition={causticPoolDefinition} {...props} />;
}

export function VoronoiCaustics(props: EffectComponentProps<VoronoiCausticsParams>) {
  return <EffectCanvas definition={voronoiCausticsDefinition} {...props} />;
}

export function LiquidDistortion(props: EffectComponentProps<LiquidDistortionParams>) {
  return <EffectCanvas definition={liquidDistortionDefinition} {...props} />;
}

export function GhostFrame(props: EffectComponentProps<GhostFrameParams>) {
  return <EffectCanvas definition={ghostFrameDefinition} {...props} />;
}

export function ButtonEmitterAura(props: EffectComponentProps<ButtonEmitterAuraParams>) {
  return <EffectCanvas definition={buttonEmitterAuraDefinition} {...props} />;
}

export function PulseTraceBorder(props: EffectComponentProps<PulseTraceBorderParams>) {
  return <EffectCanvas definition={pulseTraceBorderDefinition} {...props} />;
}

export { GhostWhooshButton };

export function ShaderRenderer({
  effectId,
  ...props
}: { effectId: EffectId } & EffectComponentProps<Record<string, unknown>>) {
  return <EffectCanvas definition={getEffectDefinition(effectId) as AnyEffectDefinition} {...props} />;
}
