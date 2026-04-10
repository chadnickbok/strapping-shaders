import type { EffectDefinition } from "../types";
import { clamp } from "../runtime/utils";
import { setUniformFloat } from "../runtime/webgl";
import {
  applyBorderCoreUniforms,
  type BorderCoreParams,
  BORDER_CORE_UNIFORM_NAMES,
  BORDER_SHADER_UTILS,
  createBorderCoreControls,
  sanitizeBorderCoreParams
} from "./sharedBorder";

export type GhostFrameParams = BorderCoreParams & {
  edgeSoftness: number;
  smokeAmount: number;
  smokeScale: number;
  smokeDrift: number;
  centerSource: number;
  edgeCatch: number;
  burstAmount: number;
  burstExpansion: number;
  burstGlowBoost: number;
  burstTurbulence: number;
};

const DEFAULT_PARAMS: GhostFrameParams = {
  thicknessPx: 16,
  cornerRadiusPx: 28,
  insetPx: 14,
  tint: "#d6f6ff",
  glowStrength: 0.34,
  glowSpread: 0.44,
  edgeSoftness: 0.48,
  smokeAmount: 0.52,
  smokeScale: 0.42,
  smokeDrift: 0.32,
  centerSource: 0.56,
  edgeCatch: 0.68,
  burstAmount: 0,
  burstExpansion: 0.58,
  burstGlowBoost: 0.66,
  burstTurbulence: 0.5
};

export const ghostFrameDefinition: EffectDefinition<GhostFrameParams> = {
  effectId: "ghost-frame",
  displayName: "Ghost Frame",
  summary: "Center-sourced vapor that catches on a rounded frame and blooms on burst.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    ...createBorderCoreControls<GhostFrameParams>(),
    {
      kind: "range",
      name: "edgeSoftness",
      label: "Edge Softness",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Broadens the frame condensation around the border."
    },
    {
      kind: "range",
      name: "smokeAmount",
      label: "Smoke Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall density of the spectral vapor."
    },
    {
      kind: "range",
      name: "smokeScale",
      label: "Smoke Scale",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls the size of smoke folds and plumes."
    },
    {
      kind: "range",
      name: "smokeDrift",
      label: "Smoke Drift",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Couples motion speed with outward advection."
    },
    {
      kind: "range",
      name: "centerSource",
      label: "Center Source",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly the vapor feels emitted from the center."
    },
    {
      kind: "range",
      name: "edgeCatch",
      label: "Edge Catch",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How much the frame shell condenses and brightens the vapor."
    },
    {
      kind: "range",
      name: "burstAmount",
      label: "Burst Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Transient burst strength for the click-poof envelope."
    },
    {
      kind: "range",
      name: "burstExpansion",
      label: "Burst Expansion",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How far the burst pushes vapor outward."
    },
    {
      kind: "range",
      name: "burstGlowBoost",
      label: "Burst Glow",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Extra halo intensity added during a burst."
    },
    {
      kind: "range",
      name: "burstTurbulence",
      label: "Burst Turbulence",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How much extra curl and breakup the burst introduces."
    }
  ],
  uniformNames: [
    ...BORDER_CORE_UNIFORM_NAMES,
    "uEdgeSoftness",
    "uSmokeAmount",
    "uSmokeScale",
    "uSmokeDrift",
    "uCenterSource",
    "uEdgeCatch",
    "uBurstAmount",
    "uBurstExpansion",
    "uBurstGlowBoost",
    "uBurstTurbulence"
  ],
  sanitizeParams(params) {
    return {
      ...sanitizeBorderCoreParams(params, DEFAULT_PARAMS),
      edgeSoftness: clamp(Number(params?.edgeSoftness ?? DEFAULT_PARAMS.edgeSoftness), 0, 1),
      smokeAmount: clamp(Number(params?.smokeAmount ?? DEFAULT_PARAMS.smokeAmount), 0, 1),
      smokeScale: clamp(Number(params?.smokeScale ?? DEFAULT_PARAMS.smokeScale), 0, 1),
      smokeDrift: clamp(Number(params?.smokeDrift ?? DEFAULT_PARAMS.smokeDrift), 0, 1),
      centerSource: clamp(Number(params?.centerSource ?? DEFAULT_PARAMS.centerSource), 0, 1),
      edgeCatch: clamp(Number(params?.edgeCatch ?? DEFAULT_PARAMS.edgeCatch), 0, 1),
      burstAmount: clamp(Number(params?.burstAmount ?? DEFAULT_PARAMS.burstAmount), 0, 1),
      burstExpansion: clamp(Number(params?.burstExpansion ?? DEFAULT_PARAMS.burstExpansion), 0, 1),
      burstGlowBoost: clamp(Number(params?.burstGlowBoost ?? DEFAULT_PARAMS.burstGlowBoost), 0, 1),
      burstTurbulence: clamp(Number(params?.burstTurbulence ?? DEFAULT_PARAMS.burstTurbulence), 0, 1)
    };
  },
  applyUniforms(context) {
    applyBorderCoreUniforms(context);
    const { gl, locations, params } = context;

    setUniformFloat(gl, locations.uEdgeSoftness, params.edgeSoftness);
    setUniformFloat(gl, locations.uSmokeAmount, params.smokeAmount);
    setUniformFloat(gl, locations.uSmokeScale, params.smokeScale);
    setUniformFloat(gl, locations.uSmokeDrift, params.smokeDrift);
    setUniformFloat(gl, locations.uCenterSource, params.centerSource);
    setUniformFloat(gl, locations.uEdgeCatch, params.edgeCatch);
    setUniformFloat(gl, locations.uBurstAmount, params.burstAmount);
    setUniformFloat(gl, locations.uBurstExpansion, params.burstExpansion);
    setUniformFloat(gl, locations.uBurstGlowBoost, params.burstGlowBoost);
    setUniformFloat(gl, locations.uBurstTurbulence, params.burstTurbulence);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uThicknessPx;
uniform float uCornerRadiusPx;
uniform float uInsetPx;
uniform vec3 uTint;
uniform float uGlowStrength;
uniform float uGlowSpread;
uniform float uEdgeSoftness;
uniform float uSmokeAmount;
uniform float uSmokeScale;
uniform float uSmokeDrift;
uniform float uCenterSource;
uniform float uEdgeCatch;
uniform float uBurstAmount;
uniform float uBurstExpansion;
uniform float uBurstGlowBoost;
uniform float uBurstTurbulence;

${BORDER_SHADER_UTILS}

void main() {
  vec2 centered = gl_FragCoord.xy - 0.5 * uResolution;
  vec2 halfSize = max(vec2(18.0), 0.5 * uResolution - vec2(uInsetPx));
  float radius = clamp(uCornerRadiusPx, 0.0, min(halfSize.x, halfSize.y) - 1.0);
  float sdf = sdRoundedRect(centered, halfSize, radius);
  float feather = aaWidth(sdf) * mix(1.0, 2.35, uEdgeSoftness);
  float glowSpreadPx = mix(10.0, 64.0, uGlowSpread);
  float burst = uBurstAmount;

  float band = bandMask(sdf, max(1.0, uThicknessPx), feather * 1.1);
  float innerShell = insideShellMask(sdf, 0.0, uThicknessPx * 1.55, feather * 1.65);
  float outerShell = outsideShellMask(sdf, 0.0, glowSpreadPx * 1.1, feather * 1.8);
  float outerHalo = glowFalloff(sdf, glowSpreadPx) * (0.14 + uGlowStrength * 0.58);

  vec2 uv = centered / min(uResolution.x, uResolution.y);
  float radialDistance = length(uv);
  vec2 radialDirection = normalize(centered + vec2(0.001, 0.0));
  float breath = 0.5 + 0.5 * sin(uTime * (0.42 + uSmokeDrift * 0.75) + uSeed * PI * 2.0);
  float source = exp(-radialDistance * mix(7.2, 4.0, uCenterSource));
  source *= 0.78 + breath * 0.26;

  float expansion = burst * mix(0.1, 1.2, uBurstExpansion);
  float turbulence = uSmokeDrift * 0.3 + burst * mix(0.12, 0.9, uBurstTurbulence);
  float fieldScale = mix(2.8, 8.4, uSmokeScale);
  vec2 seedOffset = vec2(uSeed * 9.7, uSeed * 13.3);
  vec2 fieldUv = uv * fieldScale + seedOffset;
  vec2 lowWarp = fbmVec2(fieldUv * 0.8 + vec2(0.0, -uTime * (0.08 + uSmokeDrift * 0.18)));
  vec2 highWarp = fbmVec2(fieldUv * 1.7 - vec2(uTime * 0.17, -uTime * 0.11));
  vec2 swirl = vec2(lowWarp.y - 0.5, 0.5 - lowWarp.x);
  vec2 advection = radialDirection * (radialDistance * (1.9 + expansion * 2.5) - uTime * (0.18 + uSmokeDrift * 0.32));
  vec2 sampleUv = fieldUv + advection + swirl * (0.7 + turbulence * 2.1) + (highWarp - 0.5) * (0.35 + turbulence * 0.9);

  float smokeLow = fbm(sampleUv + vec2(0.0, uTime * 0.04));
  float smokeHigh = fbm(sampleUv * 1.9 - vec2(uTime * 0.12, uTime * 0.08));
  float smokeField = mix(smokeLow, smokeHigh, 0.34 + burst * 0.18);
  smokeField = smoothstep(0.36 - uSmokeAmount * 0.17, 0.96, smokeField);

  float visibilityGate = smoothstep(0.06, 0.2 + expansion * 0.14, radialDistance);
  float carriedSource = source * visibilityGate * (0.68 + radialDistance * (1.15 + expansion * 1.2));
  float vapor = smokeField * carriedSource * (0.24 + uSmokeAmount * 1.12);

  float edgeCondensation = mix(
    innerShell * 0.85 + band * 0.78 + outerShell * 0.12,
    innerShell * 1.1 + band * 1.18 + outerShell * 0.42,
    uEdgeCatch
  );
  float caughtSmoke = vapor * edgeCondensation * (0.72 + burst * 1.05);
  float outerPlume = vapor * outsideShellMask(sdf, 0.0, glowSpreadPx * 1.8 + expansion * 28.0, feather * 2.0) *
    (0.1 + burst * 0.48);

  float frameGlow = band * (0.24 + uGlowStrength * 0.28 + burst * uBurstGlowBoost * 0.36);
  frameGlow += innerShell * 0.09;
  frameGlow += outerHalo * (0.52 + burst * uBurstGlowBoost * 0.62);

  vec3 color = uTint * (
    frameGlow +
    caughtSmoke * (1.24 + uGlowStrength * 0.2) +
    outerPlume * (0.55 + uGlowStrength * 0.3)
  );

  float alpha = frameGlow * 0.44 + caughtSmoke * 0.92 + outerPlume * 0.28 + outerHalo * 0.08;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
