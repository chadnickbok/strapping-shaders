import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import { BORDER_SHADER_UTILS } from "./sharedBorder";

export type ButtonGhostWhoosh2Params = {
  buttonCenterXPx: number;
  buttonCenterYPx: number;
  buttonWidthPx: number;
  buttonHeightPx: number;
  buttonRadiusPx: number;
  noiseScale: number;
  swirlStrength: number;
  driftSpeed: number;
  idleAmount: number;
  idleReachPx: number;
  centerSourceScaleX: number;
  centerSourceScaleY: number;
  centerFeatherPx: number;
  underOffsetPx: number;
  underHeightPx: number;
  underPadPx: number;
  whooshRadiusPx: number;
  whooshFrontWidthPx: number;
  detachStartPx: number;
  detachEndPx: number;
  riseStrength: number;
  burstAmount: number;
  burstPhase: number;
  idleOpacity: number;
  burstOpacity: number;
  interiorOpacity: number;
  glowStrength: number;
  tintA: string;
  tintB: string;
};

const BUTTON_GHOST_WHOOSH2_DEFAULTS: ButtonGhostWhoosh2Params = {
  buttonCenterXPx: 280,
  buttonCenterYPx: 160,
  buttonWidthPx: 220,
  buttonHeightPx: 72,
  buttonRadiusPx: 22,
  noiseScale: 0.034,
  swirlStrength: 0.74,
  driftSpeed: 0.22,
  idleAmount: 0.56,
  idleReachPx: 90,
  centerSourceScaleX: 0.34,
  centerSourceScaleY: 0.22,
  centerFeatherPx: 10,
  underOffsetPx: 12,
  underHeightPx: 18,
  underPadPx: 14,
  whooshRadiusPx: 84,
  whooshFrontWidthPx: 28,
  detachStartPx: 10,
  detachEndPx: 70,
  riseStrength: 0.95,
  burstAmount: 0,
  burstPhase: 0,
  idleOpacity: 1,
  burstOpacity: 0.32,
  interiorOpacity: 0.55,
  glowStrength: 0.18,
  tintA: "#bfdff1",
  tintB: "#f7fdff"
};

export const BUTTON_GHOST_WHOOSH2_OVERLAY_PRESET: Partial<ButtonGhostWhoosh2Params> = {
  idleOpacity: 1,
  burstOpacity: 0.32,
  interiorOpacity: 0.55,
  glowStrength: 0.18,
  tintA: "#bfdff1",
  tintB: "#f7fdff"
};

export const BUTTON_GHOST_WHOOSH2_UNDERLAY_PRESET: Partial<ButtonGhostWhoosh2Params> = {
  idleOpacity: 0.18,
  burstOpacity: 1,
  interiorOpacity: 0,
  glowStrength: 0.08,
  tintA: "#8cb7cb",
  tintB: "#d9f2ff"
};

export const buttonGhostWhoosh2Definition: EffectDefinition<ButtonGhostWhoosh2Params> = {
  effectId: "button-ghost-whoosh",
  displayName: "Button Ghost Whoosh 2",
  summary: "A review-only ghost smoke button study with center-born idle vapor and an under-button whoosh burst.",
  defaults: BUTTON_GHOST_WHOOSH2_DEFAULTS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "noiseScale",
      label: "Noise Scale",
      min: 0.01,
      max: 0.12,
      step: 0.001,
      description: "Sets the size of the smoke structure. Lower values make broader vapor."
    },
    {
      kind: "range",
      name: "swirlStrength",
      label: "Swirl Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls how much the smoke curls and slips around the button contour."
    },
    {
      kind: "range",
      name: "driftSpeed",
      label: "Drift Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls how quickly the idle vapor and burst plume advect over time."
    },
    {
      kind: "range",
      name: "idleAmount",
      label: "Idle Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall strength of the idle smoke emitted from the center of the button."
    },
    {
      kind: "range",
      name: "idleReachPx",
      label: "Idle Reach",
      min: 8,
      max: 256,
      step: 1,
      description: "How far idle smoke lingers outside the button before fading out."
    },
    {
      kind: "range",
      name: "centerSourceScaleX",
      label: "Center Source Width",
      min: 0.05,
      max: 1,
      step: 0.01,
      description: "Horizontal size of the idle center smoke source as a fraction of half button width."
    },
    {
      kind: "range",
      name: "centerSourceScaleY",
      label: "Center Source Height",
      min: 0.05,
      max: 1,
      step: 0.01,
      description: "Vertical size of the idle center smoke source as a fraction of half button height."
    },
    {
      kind: "range",
      name: "centerFeatherPx",
      label: "Center Feather",
      min: 0,
      max: 64,
      step: 0.5,
      description: "Softens the transition as center-born smoke crosses the button contour."
    },
    {
      kind: "range",
      name: "underOffsetPx",
      label: "Under Offset",
      min: 0,
      max: 128,
      step: 1,
      description: "How far below the button the hidden smoke reservoir sits."
    },
    {
      kind: "range",
      name: "underHeightPx",
      label: "Under Height",
      min: 1,
      max: 128,
      step: 1,
      description: "Thickness of the hidden under-button smoke capsule."
    },
    {
      kind: "range",
      name: "underPadPx",
      label: "Under Pad",
      min: 0,
      max: 128,
      step: 1,
      description: "Extends the hidden smoke capsule beyond the button underside."
    },
    {
      kind: "range",
      name: "whooshRadiusPx",
      label: "Whoosh Radius",
      min: 8,
      max: 256,
      step: 1,
      description: "How far the click burst front can push smoke away from under the button."
    },
    {
      kind: "range",
      name: "whooshFrontWidthPx",
      label: "Whoosh Front Width",
      min: 1,
      max: 128,
      step: 1,
      description: "Thickness of the smoky front during the click whoosh."
    },
    {
      kind: "range",
      name: "detachStartPx",
      label: "Detach Start",
      min: 0,
      max: 128,
      step: 1,
      description: "Distance from the button contour where smoke starts leaving contour-following motion."
    },
    {
      kind: "range",
      name: "detachEndPx",
      label: "Detach End",
      min: 1,
      max: 256,
      step: 1,
      description: "Distance from the button contour where the smoke is fully free of the contour."
    },
    {
      kind: "range",
      name: "riseStrength",
      label: "Rise Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly the click plume bends upward after it is pushed out."
    },
    {
      kind: "range",
      name: "burstAmount",
      label: "Burst Amount",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Host-driven burst envelope for the click whoosh."
    },
    {
      kind: "range",
      name: "burstPhase",
      label: "Burst Phase",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Normalized host-driven click progress. Earlier values read as the pressure push; later values rise."
    },
    {
      kind: "range",
      name: "idleOpacity",
      label: "Idle Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Scales the visibility of the idle smoke body."
    },
    {
      kind: "range",
      name: "burstOpacity",
      label: "Burst Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Scales the visibility of the click burst body."
    },
    {
      kind: "range",
      name: "interiorOpacity",
      label: "Interior Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How much idle smoke is allowed to show on top of the button face itself."
    },
    {
      kind: "range",
      name: "glowStrength",
      label: "Glow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Adds a soft halo around denser smoke regions."
    },
    {
      kind: "color",
      name: "tintA",
      label: "Tint A",
      description: "Base color for the body of the ghost smoke."
    },
    {
      kind: "color",
      name: "tintB",
      label: "Tint B",
      description: "Highlight color for the brighter edges of the smoke."
    }
  ],
  uniformNames: [
    "uButtonCenterPx",
    "uButtonSizePx",
    "uButtonRadiusPx",
    "uNoiseScale",
    "uSwirlStrength",
    "uDriftSpeed",
    "uIdleAmount",
    "uIdleReachPx",
    "uCenterSourceScale",
    "uCenterFeatherPx",
    "uUnderOffsetPx",
    "uUnderHeightPx",
    "uUnderPadPx",
    "uWhooshRadiusPx",
    "uWhooshFrontWidthPx",
    "uDetachStartPx",
    "uDetachEndPx",
    "uRiseStrength",
    "uBurstAmount",
    "uBurstPhase",
    "uIdleOpacity",
    "uBurstOpacity",
    "uInteriorOpacity",
    "uGlowStrength",
    "uTintA",
    "uTintB"
  ],
  sanitizeParams(params) {
    const detachStartPx = clamp(Number(params?.detachStartPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.detachStartPx), 0, 128);
    const detachEndInput = clamp(Number(params?.detachEndPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.detachEndPx), 1, 256);
    const detachEndPx = Math.max(detachEndInput, detachStartPx + 1);

    return {
      buttonCenterXPx: clamp(Number(params?.buttonCenterXPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.buttonCenterXPx), 0, 4096),
      buttonCenterYPx: clamp(Number(params?.buttonCenterYPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.buttonCenterYPx), 0, 4096),
      buttonWidthPx: clamp(Number(params?.buttonWidthPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.buttonWidthPx), 1, 2048),
      buttonHeightPx: clamp(Number(params?.buttonHeightPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.buttonHeightPx), 1, 2048),
      buttonRadiusPx: clamp(Number(params?.buttonRadiusPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.buttonRadiusPx), 0, 512),
      noiseScale: clamp(Number(params?.noiseScale ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.noiseScale), 0.01, 0.12),
      swirlStrength: clamp(Number(params?.swirlStrength ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.swirlStrength), 0, 1),
      driftSpeed: clamp(Number(params?.driftSpeed ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.driftSpeed), 0, 1),
      idleAmount: clamp(Number(params?.idleAmount ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.idleAmount), 0, 1),
      idleReachPx: clamp(Number(params?.idleReachPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.idleReachPx), 8, 256),
      centerSourceScaleX: clamp(Number(params?.centerSourceScaleX ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.centerSourceScaleX), 0.05, 1),
      centerSourceScaleY: clamp(Number(params?.centerSourceScaleY ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.centerSourceScaleY), 0.05, 1),
      centerFeatherPx: clamp(Number(params?.centerFeatherPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.centerFeatherPx), 0, 64),
      underOffsetPx: clamp(Number(params?.underOffsetPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.underOffsetPx), 0, 128),
      underHeightPx: clamp(Number(params?.underHeightPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.underHeightPx), 1, 128),
      underPadPx: clamp(Number(params?.underPadPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.underPadPx), 0, 128),
      whooshRadiusPx: clamp(Number(params?.whooshRadiusPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.whooshRadiusPx), 8, 256),
      whooshFrontWidthPx: clamp(Number(params?.whooshFrontWidthPx ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.whooshFrontWidthPx), 1, 128),
      detachStartPx,
      detachEndPx,
      riseStrength: clamp(Number(params?.riseStrength ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.riseStrength), 0, 1),
      burstAmount: clamp(Number(params?.burstAmount ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.burstAmount), 0, 1),
      burstPhase: clamp(Number(params?.burstPhase ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.burstPhase), 0, 1),
      idleOpacity: clamp(Number(params?.idleOpacity ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.idleOpacity), 0, 1),
      burstOpacity: clamp(Number(params?.burstOpacity ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.burstOpacity), 0, 1),
      interiorOpacity: clamp(Number(params?.interiorOpacity ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.interiorOpacity), 0, 1),
      glowStrength: clamp(Number(params?.glowStrength ?? BUTTON_GHOST_WHOOSH2_DEFAULTS.glowStrength), 0, 1),
      tintA: sanitizeHexColor(params?.tintA, BUTTON_GHOST_WHOOSH2_DEFAULTS.tintA),
      tintB: sanitizeHexColor(params?.tintB, BUTTON_GHOST_WHOOSH2_DEFAULTS.tintB)
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
    setUniformFloat(gl, locations.uNoiseScale, params.noiseScale);
    setUniformFloat(gl, locations.uSwirlStrength, params.swirlStrength);
    setUniformFloat(gl, locations.uDriftSpeed, params.driftSpeed);
    setUniformFloat(gl, locations.uIdleAmount, params.idleAmount);
    setUniformFloat(gl, locations.uIdleReachPx, params.idleReachPx * scalarScale);
    setUniformVec2(gl, locations.uCenterSourceScale, params.centerSourceScaleX, params.centerSourceScaleY);
    setUniformFloat(gl, locations.uCenterFeatherPx, params.centerFeatherPx * scalarScale);
    setUniformFloat(gl, locations.uUnderOffsetPx, params.underOffsetPx * scalarScale);
    setUniformFloat(gl, locations.uUnderHeightPx, params.underHeightPx * scalarScale);
    setUniformFloat(gl, locations.uUnderPadPx, params.underPadPx * scalarScale);
    setUniformFloat(gl, locations.uWhooshRadiusPx, params.whooshRadiusPx * scalarScale);
    setUniformFloat(gl, locations.uWhooshFrontWidthPx, params.whooshFrontWidthPx * scalarScale);
    setUniformFloat(gl, locations.uDetachStartPx, params.detachStartPx * scalarScale);
    setUniformFloat(gl, locations.uDetachEndPx, params.detachEndPx * scalarScale);
    setUniformFloat(gl, locations.uRiseStrength, params.riseStrength);
    setUniformFloat(gl, locations.uBurstAmount, params.burstAmount);
    setUniformFloat(gl, locations.uBurstPhase, params.burstPhase);
    setUniformFloat(gl, locations.uIdleOpacity, params.idleOpacity);
    setUniformFloat(gl, locations.uBurstOpacity, params.burstOpacity);
    setUniformFloat(gl, locations.uInteriorOpacity, params.interiorOpacity);
    setUniformFloat(gl, locations.uGlowStrength, params.glowStrength);
    setUniformVec3(gl, locations.uTintA, tintAR, tintAG, tintAB);
    setUniformVec3(gl, locations.uTintB, tintBR, tintBG, tintBB);
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
uniform float uNoiseScale;
uniform float uSwirlStrength;
uniform float uDriftSpeed;
uniform float uIdleAmount;
uniform float uIdleReachPx;
uniform vec2 uCenterSourceScale;
uniform float uCenterFeatherPx;
uniform float uUnderOffsetPx;
uniform float uUnderHeightPx;
uniform float uUnderPadPx;
uniform float uWhooshRadiusPx;
uniform float uWhooshFrontWidthPx;
uniform float uDetachStartPx;
uniform float uDetachEndPx;
uniform float uRiseStrength;
uniform float uBurstAmount;
uniform float uBurstPhase;
uniform float uIdleOpacity;
uniform float uBurstOpacity;
uniform float uInteriorOpacity;
uniform float uGlowStrength;
uniform vec3 uTintA;
uniform vec3 uTintB;

${BORDER_SHADER_UTILS}

vec2 normalizeOrZero(vec2 value) {
  float lengthSquared = dot(value, value);

  if (lengthSquared <= 1e-5) {
    return vec2(0.0);
  }

  return value * inversesqrt(lengthSquared);
}

float easeOutCubic(float value) {
  float t = saturate(value);
  float inv = 1.0 - t;
  return 1.0 - inv * inv * inv;
}

float sdCapsule(vec2 point, vec2 a, vec2 b, float radius) {
  vec2 pa = point - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - radius;
}

void main() {
  vec2 fragPx = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 local = fragPx - uButtonCenterPx;
  vec2 halfSize = max(uButtonSizePx * 0.5, vec2(1.0));
  float radiusLimit = max(min(halfSize.x, halfSize.y) - 1.0, 0.0);
  float radius = clamp(uButtonRadiusPx, 0.0, radiusLimit);
  float dButton = sdRoundedRect(local, halfSize, radius);
  float feather = aaWidth(dButton);
  vec2 boundary = roundedRectBoundaryPoint(local, halfSize, radius);
  vec2 boundaryNormal = normalizeOrZero(local - boundary);
  vec2 radialFromCenter = normalizeOrZero(local);

  float distToBoundary = abs(dButton);
  float attach = 1.0 - smoothstep(uDetachStartPx, uDetachEndPx, distToBoundary);
  vec2 tangent = vec2(-boundaryNormal.y, boundaryNormal.x);

  float seedAngle = uSeed * PI * 2.0;
  vec2 seedOffset = vec2(cos(seedAngle), sin(seedAngle)) * 2.3 + vec2(uSeed * 5.1, uSeed * 7.7);
  vec2 baseUv = local * uNoiseScale + seedOffset;
  vec2 flowA = fbmVec2(baseUv * 0.72 + vec2(uTime * 0.030, -uTime * 0.028));
  vec2 flowB = fbmVec2(baseUv * 1.34 - vec2(uTime * 0.044, uTime * 0.035));
  vec2 swirl = flowA + flowB - 1.0;

  vec2 freeIdle = normalizeOrZero(swirl + radialFromCenter * 0.75);
  vec2 attachedIdle = normalizeOrZero(
    tangent * sign(dot(freeIdle, tangent) + 1e-4) +
    boundaryNormal * 0.28
  );
  vec2 idleDir = normalizeOrZero(mix(freeIdle, attachedIdle, attach * (0.55 + uSwirlStrength * 0.45)));

  vec2 centerScalePx = max(halfSize * uCenterSourceScale, vec2(1.0));
  float centerN = length(local / centerScalePx) - 1.0;
  float centerDecay = exp(-max(centerN, 0.0) * 2.6);

  float boundaryEscape = smoothstep(-uCenterFeatherPx, uCenterFeatherPx + feather * 3.0 + 8.0, dButton);
  float faceVisibility = mix(uInteriorOpacity, 1.0, boundaryEscape);

  vec2 idleSampleA = baseUv * 0.82
    - idleDir * (uTime * mix(0.08, 0.26, uDriftSpeed))
    + (flowA - 0.5) * (0.55 + uSwirlStrength * 0.80);

  vec2 idleSampleB = baseUv * 1.58
    - idleDir * (uTime * mix(0.12, 0.42, uDriftSpeed))
    + (flowB - 0.5) * (0.72 + uSwirlStrength * 1.00);

  float idleNoiseA = fbm(idleSampleA);
  float idleNoiseB = fbm(idleSampleB);
  float idleNoise = smoothstep(0.34, 0.94, mix(idleNoiseA, idleNoiseB, 0.45));

  float outsideDistance = max(dButton, 0.0);
  float idleFalloff = exp(-outsideDistance / max(uIdleReachPx, 1.0));

  float idleDensity = uIdleAmount
    * idleNoise
    * centerDecay
    * mix(1.0, idleFalloff, 0.72)
    * faceVisibility
    * uIdleOpacity;

  float burstT = saturate(uBurstPhase);
  float attack = uBurstAmount * easeOutCubic(burstT / 0.16);
  float decay = 1.0 - smoothstep(0.10, 1.0, burstT);
  float burstEnv = attack * decay;
  float liftT = smoothstep(0.08, 0.62, burstT);

  vec2 underCenter = vec2(0.0, halfSize.y + uUnderOffsetPx);
  float underHalfLength = max(halfSize.x - radius + uUnderPadPx * (1.0 + attack * 0.35), 2.0);
  float underRadius = max(uUnderHeightPx * 0.5 * (1.0 + attack * 0.4), 1.0);

  float dUnder = sdCapsule(
    local,
    underCenter + vec2(-underHalfLength, 0.0),
    underCenter + vec2(underHalfLength, 0.0),
    underRadius
  );
  float underOutside = max(dUnder, 0.0);

  vec2 fromUnder = local - underCenter;
  vec2 awayUnder = normalizeOrZero(fromUnder);
  vec2 up = vec2(0.0, -1.0);
  vec2 burstDir = normalizeOrZero(mix(awayUnder, up, (0.35 + 0.65 * liftT) * uRiseStrength));

  float frontRadius = mix(0.0, uWhooshRadiusPx, easeOutCubic(burstT));
  float frontWidth = mix(uWhooshFrontWidthPx * 0.6, uWhooshFrontWidthPx, liftT);
  float whooshFront = exp(-pow((underOutside - frontRadius) / max(frontWidth, 1.0), 2.0));
  float whooshBody = exp(-underOutside / max(uWhooshRadiusPx * 0.55, 1.0));

  vec2 burstFlow = (fbmVec2(baseUv * 0.95 + vec2(0.0, -uTime * 0.055)) - 0.5)
    * (0.65 + uSwirlStrength * 0.85);

  vec2 plumeUv = local * uNoiseScale * vec2(0.9, 1.15);
  plumeUv -= burstDir * (burstT * (1.2 + uRiseStrength * 1.6));
  plumeUv += burstFlow;
  plumeUv.y -= uTime * mix(0.08, 0.26, uDriftSpeed) * (0.3 + 0.7 * liftT);

  float burstNoiseA = fbm(plumeUv * 1.12 + seedOffset * 0.12);
  float burstNoiseB = fbm(plumeUv * 1.87 - seedOffset * 0.19 + vec2(1.7, -0.6));
  float burstNoise = smoothstep(0.28, 0.95, mix(burstNoiseA, burstNoiseB, 0.42));

  float riseMask = 1.0 - smoothstep(
    -uWhooshRadiusPx * 1.4,
    halfSize.y + uUnderOffsetPx + uUnderHeightPx * 2.2,
    local.y
  );
  riseMask = mix(1.0, riseMask, liftT * 0.8);

  float releaseMask = smoothstep(-feather * 2.0, 18.0 + feather * 3.0, dButton);

  float burstDensity = max(whooshBody * (burstEnv * 0.75), whooshFront * burstEnv)
    * burstNoise
    * riseMask
    * releaseMask
    * uBurstOpacity;

  float density = idleDensity + burstDensity;
  float hotspot = pow(saturate(density), 1.45);

  float glow = density * (0.16 + uGlowStrength * 0.42);
  glow += burstDensity * (0.08 + uGlowStrength * 0.22);

  vec3 color = mix(uTintA, uTintB, hotspot);
  color *= density * (0.90 + uGlowStrength * 0.32) + glow * 0.92;

  float alpha = density * (0.52 + uGlowStrength * 0.22) + glow * 0.48;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
