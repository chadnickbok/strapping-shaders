import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import { BORDER_SHADER_UTILS } from "./sharedBorder";

export type ButtonEmitterAuraParams = {
  buttonCenterXPx: number;
  buttonCenterYPx: number;
  buttonWidthPx: number;
  buttonHeightPx: number;
  buttonRadiusPx: number;
  emitRadiusPx: number;
  edgeSoftnessPx: number;
  noiseScale: number;
  noiseAmount: number;
  driftSpeed: number;
  directionX: number;
  directionY: number;
  directionalBias: number;
  glowStrength: number;
  tintA: string;
  tintB: string;
  burstAmount: number;
  burstPhase: number;
  sourceBias: number;
  outflowStrength: number;
  curlStrength: number;
  detailMix: number;
  hotspotPower: number;
};

const DEFAULT_PARAMS: ButtonEmitterAuraParams = {
  buttonCenterXPx: 280,
  buttonCenterYPx: 160,
  buttonWidthPx: 220,
  buttonHeightPx: 72,
  buttonRadiusPx: 22,
  emitRadiusPx: 30,
  edgeSoftnessPx: 9,
  noiseScale: 0.06,
  noiseAmount: 0.72,
  driftSpeed: 0.1,
  directionX: 0,
  directionY: 0,
  directionalBias: 0.1,
  glowStrength: 0.44,
  tintA: "#f6fbff",
  tintB: "#cde7ff",
  burstAmount: 0,
  burstPhase: 0,
  sourceBias: 13,
  outflowStrength: 0.9,
  curlStrength: 0.44,
  detailMix: 0.42,
  hotspotPower: 1.25
};

export const buttonEmitterAuraDefinition: EffectDefinition<ButtonEmitterAuraParams> = {
  effectId: "button-emitter-aura",
  displayName: "Button Emitter Aura",
  summary: "A button-local aura shell with ghost and fire presets built on one emitter core.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "emitRadiusPx",
      label: "Emit Radius",
      min: 0,
      max: 128,
      step: 1,
      description: "How far the aura can drift from the button edge before fading out."
    },
    {
      kind: "range",
      name: "edgeSoftnessPx",
      label: "Edge Softness",
      min: 0,
      max: 24,
      step: 0.5,
      description: "Softens the shell boundary close to the button and at the outer falloff."
    },
    {
      kind: "range",
      name: "noiseScale",
      label: "Noise Scale",
      min: 0.02,
      max: 0.16,
      step: 0.005,
      description: "Sets the size of the large plume structure."
    },
    {
      kind: "range",
      name: "noiseAmount",
      label: "Noise Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly the field warps and breaks up around the source shell."
    },
    {
      kind: "range",
      name: "driftSpeed",
      label: "Drift Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls the advection rate through the shell."
    },
    {
      kind: "range",
      name: "directionX",
      label: "Direction X",
      min: -1,
      max: 1,
      step: 0.01,
      description: "Preferred horizontal flow direction."
    },
    {
      kind: "range",
      name: "directionY",
      label: "Direction Y",
      min: -1,
      max: 1,
      step: 0.01,
      description: "Preferred vertical flow direction. Negative values rise upward in the host coordinate space."
    },
    {
      kind: "range",
      name: "directionalBias",
      label: "Directional Bias",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Blends from omnidirectional vapor into strongly directed emission."
    },
    {
      kind: "range",
      name: "glowStrength",
      label: "Glow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Boosts halo intensity around dense regions."
    },
    {
      kind: "color",
      name: "tintA",
      label: "Tint A",
      description: "Base color for the softer emission body."
    },
    {
      kind: "color",
      name: "tintB",
      label: "Tint B",
      description: "Highlight color for the brighter plume tips."
    },
    {
      kind: "range",
      name: "burstAmount",
      label: "Burst Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Host-driven click burst amount."
    },
    {
      kind: "range",
      name: "burstPhase",
      label: "Burst Phase",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Normalized host-driven burst progress, used to distinguish attack from decay."
    },
    {
      kind: "range",
      name: "sourceBias",
      label: "Source Bias",
      min: 1,
      max: 48,
      step: 0.5,
      description: "How tightly the emission hugs the button edge before dissipating."
    },
    {
      kind: "range",
      name: "outflowStrength",
      label: "Outflow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly idle motion follows the button-local outward normal."
    },
    {
      kind: "range",
      name: "curlStrength",
      label: "Curl Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How much tangential roll the wisps pick up as they travel away from the button."
    },
    {
      kind: "range",
      name: "detailMix",
      label: "Detail Mix",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Balances broad plumes against finer breakup."
    },
    {
      kind: "range",
      name: "hotspotPower",
      label: "Hotspot Power",
      min: 0.5,
      max: 4,
      step: 0.05,
      description: "Sharpens bright highlights for flame-like looks."
    }
  ],
  uniformNames: [
    "uButtonCenterPx",
    "uButtonSizePx",
    "uButtonRadiusPx",
    "uEmitRadiusPx",
    "uEdgeSoftnessPx",
    "uNoiseScale",
    "uNoiseAmount",
    "uDriftSpeed",
    "uDirection",
    "uDirectionalBias",
    "uGlowStrength",
    "uTintA",
    "uTintB",
    "uBurstAmount",
    "uBurstPhase",
    "uSourceBias",
    "uOutflowStrength",
    "uCurlStrength",
    "uDetailMix",
    "uHotspotPower"
  ],
  sanitizeParams(params) {
    return {
      buttonCenterXPx: clamp(Number(params?.buttonCenterXPx ?? DEFAULT_PARAMS.buttonCenterXPx), 0, 4096),
      buttonCenterYPx: clamp(Number(params?.buttonCenterYPx ?? DEFAULT_PARAMS.buttonCenterYPx), 0, 4096),
      buttonWidthPx: clamp(Number(params?.buttonWidthPx ?? DEFAULT_PARAMS.buttonWidthPx), 1, 2048),
      buttonHeightPx: clamp(Number(params?.buttonHeightPx ?? DEFAULT_PARAMS.buttonHeightPx), 1, 2048),
      buttonRadiusPx: clamp(Number(params?.buttonRadiusPx ?? DEFAULT_PARAMS.buttonRadiusPx), 0, 512),
      emitRadiusPx: clamp(Number(params?.emitRadiusPx ?? DEFAULT_PARAMS.emitRadiusPx), 0, 128),
      edgeSoftnessPx: clamp(Number(params?.edgeSoftnessPx ?? DEFAULT_PARAMS.edgeSoftnessPx), 0, 24),
      noiseScale: clamp(Number(params?.noiseScale ?? DEFAULT_PARAMS.noiseScale), 0.02, 0.16),
      noiseAmount: clamp(Number(params?.noiseAmount ?? DEFAULT_PARAMS.noiseAmount), 0, 1),
      driftSpeed: clamp(Number(params?.driftSpeed ?? DEFAULT_PARAMS.driftSpeed), 0, 1),
      directionX: clamp(Number(params?.directionX ?? DEFAULT_PARAMS.directionX), -1, 1),
      directionY: clamp(Number(params?.directionY ?? DEFAULT_PARAMS.directionY), -1, 1),
      directionalBias: clamp(Number(params?.directionalBias ?? DEFAULT_PARAMS.directionalBias), 0, 1),
      glowStrength: clamp(Number(params?.glowStrength ?? DEFAULT_PARAMS.glowStrength), 0, 1),
      tintA: sanitizeHexColor(params?.tintA, DEFAULT_PARAMS.tintA),
      tintB: sanitizeHexColor(params?.tintB, DEFAULT_PARAMS.tintB),
      burstAmount: clamp(Number(params?.burstAmount ?? DEFAULT_PARAMS.burstAmount), 0, 1),
      burstPhase: clamp(Number(params?.burstPhase ?? DEFAULT_PARAMS.burstPhase), 0, 1),
      sourceBias: clamp(Number(params?.sourceBias ?? DEFAULT_PARAMS.sourceBias), 1, 48),
      outflowStrength: clamp(Number(params?.outflowStrength ?? DEFAULT_PARAMS.outflowStrength), 0, 1),
      curlStrength: clamp(Number(params?.curlStrength ?? DEFAULT_PARAMS.curlStrength), 0, 1),
      detailMix: clamp(Number(params?.detailMix ?? DEFAULT_PARAMS.detailMix), 0, 1),
      hotspotPower: clamp(Number(params?.hotspotPower ?? DEFAULT_PARAMS.hotspotPower), 0.5, 4)
    };
  },
  applyUniforms({ gl, locations, params, resolution, displaySize }) {
    const [tintAR, tintAG, tintAB] = hexToRgb(params.tintA);
    const [tintBR, tintBG, tintBB] = hexToRgb(params.tintB);
    const scaleX = resolution[0] / Math.max(displaySize[0], 1);
    const scaleY = resolution[1] / Math.max(displaySize[1], 1);
    const scalarScale = Math.min(scaleX, scaleY);

    setUniformVec2(gl, locations.uButtonCenterPx, params.buttonCenterXPx * scaleX, params.buttonCenterYPx * scaleY);
    setUniformVec2(gl, locations.uButtonSizePx, params.buttonWidthPx * scaleX, params.buttonHeightPx * scaleY);
    setUniformFloat(gl, locations.uButtonRadiusPx, params.buttonRadiusPx * scalarScale);
    setUniformFloat(gl, locations.uEmitRadiusPx, params.emitRadiusPx * scalarScale);
    setUniformFloat(gl, locations.uEdgeSoftnessPx, params.edgeSoftnessPx * scalarScale);
    setUniformFloat(gl, locations.uNoiseScale, params.noiseScale);
    setUniformFloat(gl, locations.uNoiseAmount, params.noiseAmount);
    setUniformFloat(gl, locations.uDriftSpeed, params.driftSpeed);
    setUniformVec2(gl, locations.uDirection, params.directionX, params.directionY);
    setUniformFloat(gl, locations.uDirectionalBias, params.directionalBias);
    setUniformFloat(gl, locations.uGlowStrength, params.glowStrength);
    setUniformVec3(gl, locations.uTintA, tintAR, tintAG, tintAB);
    setUniformVec3(gl, locations.uTintB, tintBR, tintBG, tintBB);
    setUniformFloat(gl, locations.uBurstAmount, params.burstAmount);
    setUniformFloat(gl, locations.uBurstPhase, params.burstPhase);
    setUniformFloat(gl, locations.uSourceBias, params.sourceBias * scalarScale);
    setUniformFloat(gl, locations.uOutflowStrength, params.outflowStrength);
    setUniformFloat(gl, locations.uCurlStrength, params.curlStrength);
    setUniformFloat(gl, locations.uDetailMix, params.detailMix);
    setUniformFloat(gl, locations.uHotspotPower, params.hotspotPower);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform vec2 uButtonCenterPx;
uniform vec2 uButtonSizePx;
uniform float uButtonRadiusPx;
uniform float uEmitRadiusPx;
uniform float uEdgeSoftnessPx;
uniform float uNoiseScale;
uniform float uNoiseAmount;
uniform float uDriftSpeed;
uniform vec2 uDirection;
uniform float uDirectionalBias;
uniform float uGlowStrength;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform float uBurstAmount;
uniform float uBurstPhase;
uniform float uSourceBias;
uniform float uOutflowStrength;
uniform float uCurlStrength;
uniform float uDetailMix;
uniform float uHotspotPower;

${BORDER_SHADER_UTILS}

vec2 normalizeOrZero(vec2 value) {
  float lengthSquared = dot(value, value);

  if (lengthSquared <= 1e-5) {
    return vec2(0.0);
  }

  return value * inversesqrt(lengthSquared);
}

void main() {
  vec2 fragPx = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 local = fragPx - uButtonCenterPx;
  vec2 halfSize = max(uButtonSizePx * 0.5, vec2(1.0));
  float radiusLimit = max(min(halfSize.x, halfSize.y) - 1.0, 0.0);
  float radius = clamp(uButtonRadiusPx, 0.0, radiusLimit);
  float sdf = sdRoundedRect(local, halfSize, radius);
  float feather = aaWidth(sdf);
  float emitRadius = max(uEmitRadiusPx, feather * 2.0);
  float edgeSoftness = max(uEdgeSoftnessPx, feather * 1.5);
  float outside = smoothstep(0.0, feather, sdf);
  float shell = 1.0 - smoothstep(0.0, emitRadius, sdf);
  float outerFade = 1.0 - smoothstep(max(emitRadius - edgeSoftness, 0.0), emitRadius, sdf);
  float emitMask = outside * shell * outerFade;

  vec2 boundary = roundedRectBoundaryPoint(local, halfSize, radius);
  float perimeter = max(roundedRectPerimeter(halfSize, radius), 1.0);
  float rawPerimeterCoord = roundedRectPerimeterCoord(boundary, halfSize, radius);
  float perimeterCoord = mod(rawPerimeterCoord + perimeter * 0.5, perimeter);
  vec2 boundaryTangent = roundedRectBoundaryTangent(boundary, halfSize, radius);
  vec2 outward = normalizeOrZero(local - boundary);
  vec2 dir = normalizeOrZero(uDirection);
  float sourceDistance = max(sdf, 0.0);
  float shellT = saturate(sourceDistance / max(emitRadius, 0.001));
  float burst = uBurstAmount;
  float burstPhase = uBurstPhase;
  float directionMagnitude = step(1e-4, dot(dir, dir));
  float burstLead = burst * (1.0 - smoothstep(0.16, 0.52, burstPhase));
  float burstCurl = burst * sin(clamp(burstPhase, 0.0, 1.0) * PI);
  float burstTail = burst * smoothstep(0.2, 1.0, burstPhase);
  float localScale = max(max(halfSize.x, halfSize.y) + emitRadius, 1.0);
  vec2 localUv = local / localScale;
  float seedAngle = uSeed * PI * 2.0;
  vec2 seedOffset = vec2(cos(seedAngle), sin(seedAngle)) * 2.7 + vec2(uSeed * 4.2, uSeed * 7.4);
  float noiseScaleT = saturate((uNoiseScale - 0.02) / 0.14);
  float fieldScale = mix(2.4, 7.2, noiseScaleT);
  float corner = cornerWeight(boundary, halfSize, radius);
  float directionalLift = directionMagnitude * uDirectionalBias * smoothstep(0.14, 0.88, shellT);
  vec2 peelDir = normalizeOrZero(outward * (0.72 + uOutflowStrength * 0.62) + dir * directionalLift * 1.5);
  vec2 transportDir = normalizeOrZero(mix(boundaryTangent, dir, directionMagnitude * directionalLift * 0.12));
  vec2 baseFieldUv = localUv * fieldScale + seedOffset;
  vec2 macroWarpA = fbmVec2(baseFieldUv * 0.64 + vec2(uTime * 0.04, -uTime * 0.03));
  vec2 macroWarpB = fbmVec2(baseFieldUv * 1.12 - vec2(uTime * 0.06, uTime * 0.05));
  vec2 ambientWarp = (macroWarpA - 0.5) * (0.08 + uNoiseAmount * 0.12);
  ambientWarp += (macroWarpB - 0.5) * (0.03 + uNoiseAmount * 0.07);
  float contourPhase = perimeterCoord / perimeter * PI * 2.0;
  float breath = 0.5 + 0.5 * sin(uTime * (0.24 + uDriftSpeed * 0.38) + contourPhase + seedAngle);
  float spreadScale = 0.03 + uNoiseScale * 0.2;
  float driftRate = mix(0.035, 0.22, uDriftSpeed) * (0.74 + 0.2 * breath);
  float alongDrift = uTime * driftRate;
  float outwardCarry = uTime * mix(0.012, 0.085, uOutflowStrength) * (0.46 + 0.54 * shellT) * (0.72 + 0.28 * breath);
  float transportPhase = dot(baseFieldUv + ambientWarp * 0.24, transportDir);
  float peelPhase = dot(baseFieldUv + ambientWarp * 0.18, peelDir);
  float contourTravel = alongDrift / perimeter * PI * 2.0;
  float contourWaveA = contourPhase - contourTravel * 0.72 + transportPhase * 0.035;
  float contourWaveB = contourPhase - contourTravel * 1.18 + transportPhase * 0.052 + peelPhase * 0.02;
  vec2 contourLoopA = vec2(cos(contourWaveA), sin(contourWaveA));
  vec2 contourLoopB = vec2(cos(contourWaveB * 1.57 + seedAngle * 0.18), sin(contourWaveB * 1.57 + seedAngle * 0.18));
  float contourLoopScaleA = 1.7 + noiseScaleT * 2.4;
  float contourLoopScaleB = 2.7 + noiseScaleT * 3.2;
  vec2 contourCarrierA = contourLoopA * contourLoopScaleA;
  vec2 contourCarrierB = contourLoopB * contourLoopScaleB;
  vec2 radialCarrierA = vec2(sourceDistance * spreadScale * 0.98 + peelPhase * 0.07, outwardCarry * 0.5);
  vec2 radialCarrierB = vec2(sourceDistance * spreadScale * 1.54 + peelPhase * 0.12, outwardCarry * 0.84);
  vec2 plumeNoiseA = fbmVec2(contourCarrierA + radialCarrierA + seedOffset.yx * 0.18);
  vec2 plumeNoiseB = fbmVec2(contourCarrierB + radialCarrierB - seedOffset * 0.28);
  float alongWarp = (plumeNoiseA.x - 0.5) * (0.08 + uCurlStrength * 0.12) * mix(1.0, 0.8, corner);
  float curlEnvelope = sin(shellT * PI) * (0.04 + uCurlStrength * 0.12) * mix(1.0, 0.86, corner);
  float curlShift = ((plumeNoiseA.y - 0.5) * 0.68 + (plumeNoiseB.x - 0.5) * 0.32) * curlEnvelope;
  float outwardShift = outwardCarry * (0.42 + uOutflowStrength * 0.38);
  outwardShift += (plumeNoiseB.y - 0.5) * (0.05 + uNoiseAmount * 0.08);
  float sampleWaveA = contourPhase - contourTravel + alongWarp * 0.55 + curlShift * 0.22;
  float sampleWaveB = contourPhase - contourTravel * 1.24 + alongWarp * 0.82 + curlShift * 0.36;
  vec2 sampleLoopA = vec2(cos(sampleWaveA), sin(sampleWaveA));
  vec2 sampleLoopB = vec2(cos(sampleWaveB * 1.63 + seedAngle * 0.11), sin(sampleWaveB * 1.63 + seedAngle * 0.11));
  vec2 sampleUvA = sampleLoopA * contourLoopScaleA +
    vec2(sourceDistance * spreadScale * 1.04 + peelPhase * 0.08, outwardShift) +
    vec2(transportPhase * 0.08, peelPhase * 0.05);
  vec2 sampleUvB = sampleLoopB * contourLoopScaleB +
    vec2(sourceDistance * spreadScale * 1.66 + peelPhase * 0.13, outwardShift * 1.08) +
    vec2(transportPhase * 0.12, peelPhase * 0.08);
  sampleUvA += vec2(dot(ambientWarp, transportDir) * 0.44, dot(ambientWarp, peelDir) * 0.32);
  sampleUvB += vec2(dot(ambientWarp.yx, transportDir) * 0.6, dot(ambientWarp, peelDir) * 0.46);
  sampleUvA += vec2(-burstLead * 0.08 + burstCurl * 0.02, burstLead * (0.12 + uOutflowStrength * 0.14));
  sampleUvB += vec2(-burstLead * 0.14 + burstCurl * 0.04, burstLead * (0.16 + uOutflowStrength * 0.18) + burstCurl * 0.05);
  float densityA = fbm(sampleUvA);
  float densityB = fbm(sampleUvB);
  float densityMacro = fbm(baseFieldUv * 0.58 + peelDir * (uTime * (0.05 + uDriftSpeed * 0.08)) + ambientWarp * 0.4);
  float density = mix(densityA, densityA * mix(densityB, densityMacro, 0.35), uDetailMix);
  density = smoothstep(0.3 - uNoiseAmount * 0.14, 0.9, density);

  float directionWeight = mix(1.0, 0.38 + 0.62 * max(dot(outward, dir), 0.0), uDirectionalBias * directionMagnitude);
  float sourceDistanceShifted = max(sdf - burstLead * edgeSoftness * 0.22, 0.0);
  float sourceCore = exp(-sourceDistanceShifted / max(uSourceBias * (1.0 + burstTail * 0.18), 0.001));
  float sourceTail = exp(-sourceDistanceShifted / max(uSourceBias * (2.4 + uOutflowStrength), 0.001));
  sourceTail *= (1.0 - smoothstep(0.78, 1.0, shellT));
  sourceTail *= smoothstep(0.18, 0.72, densityA) * mix(0.8, 1.0, densityB);
  sourceTail *= (0.08 + uNoiseAmount * 0.12 + uOutflowStrength * 0.08) * mix(0.9, 0.72, corner);
  float source = sourceCore + sourceTail * (1.0 - sourceCore);
  float densityBoost = 1.08 + uOutflowStrength * 0.22 + burstLead * 1.02 + burstCurl * 0.46 + burstTail * 0.14;
  float glowBoost = 1.0 + burstLead * 0.38 + burstTail * 0.26;
  density *= emitMask * source * directionWeight * densityBoost;

  float hotspot = pow(saturate(density), max(uHotspotPower, 0.001));
  float glow = emitMask * (sourceCore * (0.08 + uGlowStrength * 0.32) + source * (0.12 + uGlowStrength * 0.5)) * glowBoost;
  glow += density * (0.12 + uGlowStrength * 0.24);
  vec3 color = mix(uTintA, uTintB, hotspot);
  color *= density * (1.1 + uGlowStrength * 0.28) + glow * 0.96;

  float alpha = density * (0.5 + uGlowStrength * 0.26) + glow * 0.74;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
