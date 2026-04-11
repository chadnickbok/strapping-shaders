import type { EffectDefinition, EffectId } from "./types";
import { auroraFieldDefinition, type AuroraFieldParams } from "./effects/auroraField";
import { causticPoolDefinition, type CausticPoolParams } from "./effects/causticPool";
import { contoursDefinition, type ContoursParams } from "./effects/contours";
import { buttonEmitterAuraDefinition, type ButtonEmitterAuraParams } from "./effects/buttonEmitterAura";
import { buttonGhostWhoosh2Definition, type ButtonGhostWhoosh2Params } from "./effects/buttonGhostWhoosh2";
import { ghostFrameDefinition, type GhostFrameParams } from "./effects/ghostFrame";
import { ghostWhooshButtonDefinition, type GhostWhooshButtonParams } from "./effects/ghostWhooshButton";
import { holographicFoilDefinition, type HolographicFoilParams } from "./effects/holographicFoil";
import { inkBleedDefinition, type InkBleedParams } from "./effects/inkBleed";
import { jellySpiralDefinition, type JellySpiralParams } from "./effects/jellySpiral";
import { lavaLampDefinition, type LavaLampParams } from "./effects/lavaLamp";
import { liquidDistortionDefinition, type LiquidDistortionParams } from "./effects/liquidDistortion";
import { orbitConfettiDefinition, type OrbitConfettiParams } from "./effects/orbitConfetti";
import { paperFibersDefinition, type PaperFibersParams } from "./effects/paperFibers";
import { plasmaCheckerDefinition, type PlasmaCheckerParams } from "./effects/plasmaChecker";
import { prismRefractionDefinition, type PrismRefractionParams } from "./effects/prismRefraction";
import { pulseTraceBorderDefinition, type PulseTraceBorderParams } from "./effects/pulseTraceBorder";
import { risoMisprintDefinition, type RisoMisprintParams } from "./effects/risoMisprint";
import { stainedGlassDefinition, type StainedGlassParams } from "./effects/stainedGlass";
import { starTunnelDefinition, type StarTunnelParams } from "./effects/starTunnel";
import { thermalBloomDefinition, type ThermalBloomParams } from "./effects/thermalBloom";
import { truchetNeonDefinition, type TruchetNeonParams } from "./effects/truchetNeon";
import { velvetMeshDefinition, type VelvetMeshParams } from "./effects/velvetMesh";
import { voronoiCausticsDefinition, type VoronoiCausticsParams } from "./effects/voronoiCaustics";
import { vhsPosterDefinition, type VhsPosterParams } from "./effects/vhsPoster";

export type EffectParamsById = {
  "aurora-field": AuroraFieldParams;
  "caustic-pool": CausticPoolParams;
  contours: ContoursParams;
  "voronoi-caustics": VoronoiCausticsParams;
  "holographic-foil": HolographicFoilParams;
  "ink-bleed": InkBleedParams;
  "jelly-spiral": JellySpiralParams;
  "lava-lamp": LavaLampParams;
  "liquid-distortion": LiquidDistortionParams;
  "orbit-confetti": OrbitConfettiParams;
  "paper-fibers": PaperFibersParams;
  "plasma-checker": PlasmaCheckerParams;
  "prism-refraction": PrismRefractionParams;
  "riso-misprint": RisoMisprintParams;
  "stained-glass": StainedGlassParams;
  "star-tunnel": StarTunnelParams;
  "thermal-bloom": ThermalBloomParams;
  "truchet-neon": TruchetNeonParams;
  "velvet-mesh": VelvetMeshParams;
  "vhs-poster": VhsPosterParams;
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
  contours: contoursDefinition,
  "voronoi-caustics": voronoiCausticsDefinition,
  "holographic-foil": holographicFoilDefinition,
  "ink-bleed": inkBleedDefinition,
  "jelly-spiral": jellySpiralDefinition,
  "lava-lamp": lavaLampDefinition,
  "liquid-distortion": liquidDistortionDefinition,
  "orbit-confetti": orbitConfettiDefinition,
  "paper-fibers": paperFibersDefinition,
  "plasma-checker": plasmaCheckerDefinition,
  "prism-refraction": prismRefractionDefinition,
  "riso-misprint": risoMisprintDefinition,
  "stained-glass": stainedGlassDefinition,
  "star-tunnel": starTunnelDefinition,
  "thermal-bloom": thermalBloomDefinition,
  "truchet-neon": truchetNeonDefinition,
  "velvet-mesh": velvetMeshDefinition,
  "vhs-poster": vhsPosterDefinition,
  "ghost-frame": ghostFrameDefinition,
  "button-emitter-aura": buttonEmitterAuraDefinition,
  "button-ghost-whoosh": buttonGhostWhoosh2Definition,
  "ghost-whoosh-button": ghostWhooshButtonDefinition,
  "pulse-trace-border": pulseTraceBorderDefinition
};

export const effectOrder: EffectId[] = [
  "aurora-field",
  "caustic-pool",
  "contours",
  "voronoi-caustics",
  "holographic-foil",
  "ink-bleed",
  "jelly-spiral",
  "lava-lamp",
  "liquid-distortion",
  "orbit-confetti",
  "paper-fibers",
  "plasma-checker",
  "prism-refraction",
  "riso-misprint",
  "stained-glass",
  "star-tunnel",
  "thermal-bloom",
  "truchet-neon",
  "velvet-mesh",
  "vhs-poster",
  "ghost-frame",
  "button-emitter-aura",
  "button-ghost-whoosh",
  "ghost-whoosh-button",
  "pulse-trace-border"
];

export function getEffectDefinition(effectId: EffectId) {
  return effectRegistry[effectId];
}
