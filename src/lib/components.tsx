import type { AnyEffectDefinition, EffectComponentProps, EffectId } from "./types";
import { GhostWhooshButton } from "./GhostWhooshButton";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { causticPoolDefinition, type CausticPoolParams } from "./effects/causticPool";
import { cinematicBokehDefinition, type CinematicBokehParams } from "./effects/cinematicBokeh";
import { contoursDefinition, type ContoursParams } from "./effects/contours";
import { ditheringDefinition, type DitheringParams } from "./effects/dithering";
import { buttonEmitterAuraDefinition, type ButtonEmitterAuraParams } from "./effects/buttonEmitterAura";
import { flowingGradientDefinition, type FlowingGradientParams } from "./effects/flowingGradient";
import { frostedAcrylicDefinition, type FrostedAcrylicParams } from "./effects/frostedAcrylic";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { holographicFoilDefinition, type HolographicFoilParams } from "./effects/holographicFoil";
import { inkBleedDefinition, type InkBleedParams } from "./effects/inkBleed";
import { jellySpiralDefinition, type JellySpiralParams } from "./effects/jellySpiral";
import { lavaLampDefinition, type LavaLampParams } from "./effects/lavaLamp";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { moireSilkDefinition, type MoireSilkParams } from "./effects/moireSilk";
import { orbitConfettiDefinition, type OrbitConfettiParams } from "./effects/orbitConfetti";
import { paperFibersDefinition, type PaperFibersParams } from "./effects/paperFibers";
import { plasmaCheckerDefinition, type PlasmaCheckerParams } from "./effects/plasmaChecker";
import { prismRefractionDefinition, type PrismRefractionParams } from "./effects/prismRefraction";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";
import { risoMisprintDefinition, type RisoMisprintParams } from "./effects/risoMisprint";
import {
  soapFilmInterferenceDefinition,
  type SoapFilmInterferenceParams
} from "./effects/soapFilmInterference";
import { stainedGlassDefinition, type StainedGlassParams } from "./effects/stainedGlass";
import { starTunnelDefinition, type StarTunnelParams } from "./effects/starTunnel";
import { studioDitherFadeDefinition, type StudioDitherFadeParams } from "./effects/studioDitherFade";
import { thermalBloomDefinition, type ThermalBloomParams } from "./effects/thermalBloom";
import { truchetNeonDefinition, type TruchetNeonParams } from "./effects/truchetNeon";
import { velvetMeshDefinition, type VelvetMeshParams } from "./effects/velvetMesh";
import { voronoiCausticsDefinition, type VoronoiCausticsParams } from "./effects/voronoiCaustics";
import { vhsPosterDefinition, type VhsPosterParams } from "./effects/vhsPoster";
import { getEffectDefinition } from "./registry";
import { EffectCanvas } from "./runtime/EffectCanvas";

export function AuroraField(props: EffectComponentProps<AuroraFieldParams>) {
  return <EffectCanvas definition={auroraFieldDefinition} {...props} />;
}

export function FlowingGradient(props: EffectComponentProps<FlowingGradientParams>) {
  return <EffectCanvas definition={flowingGradientDefinition} {...props} />;
}

export function CinematicBokeh(props: EffectComponentProps<CinematicBokehParams>) {
  return <EffectCanvas definition={cinematicBokehDefinition} {...props} />;
}

export function SoapFilmInterference(props: EffectComponentProps<SoapFilmInterferenceParams>) {
  return <EffectCanvas definition={soapFilmInterferenceDefinition} {...props} />;
}

export function FrostedAcrylic(props: EffectComponentProps<FrostedAcrylicParams>) {
  return <EffectCanvas definition={frostedAcrylicDefinition} {...props} />;
}

export function MoireSilk(props: EffectComponentProps<MoireSilkParams>) {
  return <EffectCanvas definition={moireSilkDefinition} {...props} />;
}

export function StudioDitherFade(props: EffectComponentProps<StudioDitherFadeParams>) {
  return <EffectCanvas definition={studioDitherFadeDefinition} {...props} />;
}

export function CausticPool(props: EffectComponentProps<CausticPoolParams>) {
  return <EffectCanvas definition={causticPoolDefinition} {...props} />;
}

export function Contours(props: EffectComponentProps<ContoursParams>) {
  return <EffectCanvas definition={contoursDefinition} {...props} />;
}

export function Dithering(props: EffectComponentProps<DitheringParams>) {
  return <EffectCanvas definition={ditheringDefinition} {...props} />;
}

export function VoronoiCaustics(props: EffectComponentProps<VoronoiCausticsParams>) {
  return <EffectCanvas definition={voronoiCausticsDefinition} {...props} />;
}

export function HolographicFoil(props: EffectComponentProps<HolographicFoilParams>) {
  return <EffectCanvas definition={holographicFoilDefinition} {...props} />;
}

export function InkBleed(props: EffectComponentProps<InkBleedParams>) {
  return <EffectCanvas definition={inkBleedDefinition} {...props} />;
}

export function JellySpiral(props: EffectComponentProps<JellySpiralParams>) {
  return <EffectCanvas definition={jellySpiralDefinition} {...props} />;
}

export function LavaLamp(props: EffectComponentProps<LavaLampParams>) {
  return <EffectCanvas definition={lavaLampDefinition} {...props} />;
}

export function LiquidDistortion(props: EffectComponentProps<LiquidDistortionParams>) {
  return <EffectCanvas definition={liquidDistortionDefinition} {...props} />;
}

export function OrbitConfetti(props: EffectComponentProps<OrbitConfettiParams>) {
  return <EffectCanvas definition={orbitConfettiDefinition} {...props} />;
}

export function PaperFibers(props: EffectComponentProps<PaperFibersParams>) {
  return <EffectCanvas definition={paperFibersDefinition} {...props} />;
}

export function PlasmaChecker(props: EffectComponentProps<PlasmaCheckerParams>) {
  return <EffectCanvas definition={plasmaCheckerDefinition} {...props} />;
}

export function PrismRefraction(props: EffectComponentProps<PrismRefractionParams>) {
  return <EffectCanvas definition={prismRefractionDefinition} {...props} />;
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

export function RisoMisprint(props: EffectComponentProps<RisoMisprintParams>) {
  return <EffectCanvas definition={risoMisprintDefinition} {...props} />;
}

export function StainedGlass(props: EffectComponentProps<StainedGlassParams>) {
  return <EffectCanvas definition={stainedGlassDefinition} {...props} />;
}

export function StarTunnel(props: EffectComponentProps<StarTunnelParams>) {
  return <EffectCanvas definition={starTunnelDefinition} {...props} />;
}

export function ThermalBloom(props: EffectComponentProps<ThermalBloomParams>) {
  return <EffectCanvas definition={thermalBloomDefinition} {...props} />;
}

export function TruchetNeon(props: EffectComponentProps<TruchetNeonParams>) {
  return <EffectCanvas definition={truchetNeonDefinition} {...props} />;
}

export function VelvetMesh(props: EffectComponentProps<VelvetMeshParams>) {
  return <EffectCanvas definition={velvetMeshDefinition} {...props} />;
}

export function VhsPoster(props: EffectComponentProps<VhsPosterParams>) {
  return <EffectCanvas definition={vhsPosterDefinition} {...props} />;
}

export { GhostWhooshButton };

export function ShaderRenderer({
  effectId,
  ...props
}: { effectId: EffectId } & EffectComponentProps<Record<string, unknown>>) {
  return <EffectCanvas definition={getEffectDefinition(effectId) as AnyEffectDefinition} {...props} />;
}
