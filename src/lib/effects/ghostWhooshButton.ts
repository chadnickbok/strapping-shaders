import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import { BORDER_SHADER_UTILS } from "./sharedBorder";

export type ButtonGhostWhooshParams = {
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

export type GhostWhooshButtonParams = ButtonGhostWhooshParams;

export const GHOST_BASE: ButtonGhostWhooshParams = {
  buttonCenterXPx: 280,
  buttonCenterYPx: 160,
  buttonWidthPx: 220,
  buttonHeightPx: 72,
  buttonRadiusPx: 22,
  noiseScale: 0.034,
  swirlStrength: 0.74,
  driftSpeed: 0.22,
  idleAmount: 0.82,
  idleReachPx: 112,
  centerSourceScaleX: 0.46,
  centerSourceScaleY: 0.3,
  centerFeatherPx: 14,
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
  interiorOpacity: 0.64,
  glowStrength: 0.26,
  tintA: "#c8e8f6",
  tintB: "#f7fdff"
};

export const GHOST_OVER: ButtonGhostWhooshParams = {
  ...GHOST_BASE
};

export const GHOST_UNDER: ButtonGhostWhooshParams = {
  ...GHOST_BASE,
  idleOpacity: 0.18,
  burstOpacity: 1,
  interiorOpacity: 0,
  glowStrength: 0.08,
  tintA: "#8cb7cb",
  tintB: "#d9f2ff"
};

export const ghostWhooshButtonDefinition: EffectDefinition<ButtonGhostWhooshParams> = {
  effectId: "ghost-whoosh-button",
  displayName: "Ghost Whoosh Button",
  summary: "Center-born idle smoke over the button and a separate underside whoosh burst rendered as a second instance.",
  defaults: GHOST_BASE,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "noiseScale",
      label: "Noise Scale",
      min: 0.01,
      max: 0.08,
      step: 0.001,
      description: "Sets the size of the plume structure."
    },
    {
      kind: "range",
      name: "swirlStrength",
      label: "Swirl Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls how much the smoke curls around the button before detaching."
    },
    {
      kind: "range",
      name: "driftSpeed",
      label: "Drift Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Sets the motion rate for the idle and burst flow."
    },
    {
      kind: "range",
      name: "idleAmount",
      label: "Idle Amount",
      min: 0,
      max: 1.25,
      step: 0.01,
      description: "Overall density of the center-born idle smoke."
    },
    {
      kind: "range",
      name: "idleReachPx",
      label: "Idle Reach",
      min: 8,
      max: 180,
      step: 1,
      description: "How far the idle smoke can drift after it escapes the button."
    },
    {
      kind: "range",
      name: "centerSourceScaleX",
      label: "Center Scale X",
      min: 0.1,
      max: 1,
      step: 0.01,
      description: "Horizontal size of the idle source ellipse as a fraction of half button width."
    },
    {
      kind: "range",
      name: "centerSourceScaleY",
      label: "Center Scale Y",
      min: 0.1,
      max: 1,
      step: 0.01,
      description: "Vertical size of the idle source ellipse as a fraction of half button height."
    },
    {
      kind: "range",
      name: "centerFeatherPx",
      label: "Center Feather",
      min: 0,
      max: 32,
      step: 1,
      description: "Softens the transition from the button face to the exterior smoke."
    },
    {
      kind: "range",
      name: "underOffsetPx",
      label: "Under Offset",
      min: 0,
      max: 48,
      step: 1,
      description: "Places the stored-smoke capsule below the button."
    },
    {
      kind: "range",
      name: "underHeightPx",
      label: "Under Height",
      min: 2,
      max: 48,
      step: 1,
      description: "Thickness of the under-button smoke reservoir."
    },
    {
      kind: "range",
      name: "underPadPx",
      label: "Under Pad",
      min: 0,
      max: 48,
      step: 1,
      description: "Extends the under-button capsule beyond the straight underside."
    },
    {
      kind: "range",
      name: "whooshRadiusPx",
      label: "Whoosh Radius",
      min: 8,
      max: 160,
      step: 1,
      description: "How far the click front can travel away from the hidden smoke pocket."
    },
    {
      kind: "range",
      name: "whooshFrontWidthPx",
      label: "Front Width",
      min: 4,
      max: 64,
      step: 1,
      description: "Thickness of the traveling smoky front."
    },
    {
      kind: "range",
      name: "detachStartPx",
      label: "Detach Start",
      min: 0,
      max: 64,
      step: 1,
      description: "Distance where the smoke begins to stop contour-following."
    },
    {
      kind: "range",
      name: "detachEndPx",
      label: "Detach End",
      min: 8,
      max: 140,
      step: 1,
      description: "Distance where contour attachment finishes and free plume motion takes over."
    },
    {
      kind: "range",
      name: "riseStrength",
      label: "Rise Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly the detached plume bends upward."
    },
    {
      kind: "range",
      name: "idleOpacity",
      label: "Idle Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Scales the idle-smoke contribution."
    },
    {
      kind: "range",
      name: "burstOpacity",
      label: "Burst Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Scales the under-button whoosh contribution."
    },
    {
      kind: "range",
      name: "interiorOpacity",
      label: "Interior Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How much idle smoke can remain visible on the button face."
    },
    {
      kind: "range",
      name: "glowStrength",
      label: "Glow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Adds a soft halo around denser smoke."
    },
    {
      kind: "color",
      name: "tintA",
      label: "Tint A",
      description: "Base smoke color."
    },
    {
      kind: "color",
      name: "tintB",
      label: "Tint B",
      description: "Highlight smoke color."
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
    const detachStartPx = clamp(Number(params?.detachStartPx ?? GHOST_BASE.detachStartPx), 0, 64);
    const detachEndPx = Math.max(
      detachStartPx + 1,
      clamp(Number(params?.detachEndPx ?? GHOST_BASE.detachEndPx), 8, 140)
    );

    return {
      buttonCenterXPx: clamp(Number(params?.buttonCenterXPx ?? GHOST_BASE.buttonCenterXPx), 0, 4096),
      buttonCenterYPx: clamp(Number(params?.buttonCenterYPx ?? GHOST_BASE.buttonCenterYPx), 0, 4096),
      buttonWidthPx: clamp(Number(params?.buttonWidthPx ?? GHOST_BASE.buttonWidthPx), 1, 2048),
      buttonHeightPx: clamp(Number(params?.buttonHeightPx ?? GHOST_BASE.buttonHeightPx), 1, 2048),
      buttonRadiusPx: clamp(Number(params?.buttonRadiusPx ?? GHOST_BASE.buttonRadiusPx), 0, 512),
      noiseScale: clamp(Number(params?.noiseScale ?? GHOST_BASE.noiseScale), 0.01, 0.08),
      swirlStrength: clamp(Number(params?.swirlStrength ?? GHOST_BASE.swirlStrength), 0, 1),
      driftSpeed: clamp(Number(params?.driftSpeed ?? GHOST_BASE.driftSpeed), 0, 1),
      idleAmount: clamp(Number(params?.idleAmount ?? GHOST_BASE.idleAmount), 0, 1.25),
      idleReachPx: clamp(Number(params?.idleReachPx ?? GHOST_BASE.idleReachPx), 0, 180),
      centerSourceScaleX: clamp(Number(params?.centerSourceScaleX ?? GHOST_BASE.centerSourceScaleX), 0.1, 1),
      centerSourceScaleY: clamp(Number(params?.centerSourceScaleY ?? GHOST_BASE.centerSourceScaleY), 0.1, 1),
      centerFeatherPx: clamp(Number(params?.centerFeatherPx ?? GHOST_BASE.centerFeatherPx), 0, 32),
      underOffsetPx: clamp(Number(params?.underOffsetPx ?? GHOST_BASE.underOffsetPx), 0, 48),
      underHeightPx: clamp(Number(params?.underHeightPx ?? GHOST_BASE.underHeightPx), 2, 48),
      underPadPx: clamp(Number(params?.underPadPx ?? GHOST_BASE.underPadPx), 0, 48),
      whooshRadiusPx: clamp(Number(params?.whooshRadiusPx ?? GHOST_BASE.whooshRadiusPx), 8, 160),
      whooshFrontWidthPx: clamp(Number(params?.whooshFrontWidthPx ?? GHOST_BASE.whooshFrontWidthPx), 4, 64),
      detachStartPx,
      detachEndPx,
      riseStrength: clamp(Number(params?.riseStrength ?? GHOST_BASE.riseStrength), 0, 1),
      burstAmount: clamp(Number(params?.burstAmount ?? GHOST_BASE.burstAmount), 0, 1),
      burstPhase: clamp(Number(params?.burstPhase ?? GHOST_BASE.burstPhase), 0, 1),
      idleOpacity: clamp(Number(params?.idleOpacity ?? GHOST_BASE.idleOpacity), 0, 1),
      burstOpacity: clamp(Number(params?.burstOpacity ?? GHOST_BASE.burstOpacity), 0, 1),
      interiorOpacity: clamp(Number(params?.interiorOpacity ?? GHOST_BASE.interiorOpacity), 0, 1),
      glowStrength: clamp(Number(params?.glowStrength ?? GHOST_BASE.glowStrength), 0, 1),
      tintA: sanitizeHexColor(params?.tintA, GHOST_BASE.tintA),
      tintB: sanitizeHexColor(params?.tintB, GHOST_BASE.tintB)
    };
  },
  applyUniforms({ gl, locations, params, resolution, displaySize }) {
    const [tintAR, tintAG, tintAB] = hexToRgb(params.tintA);
    const [tintBR, tintBG, tintBB] = hexToRgb(params.tintB);
    const scaleX = resolution[0] / Math.max(displaySize[0], 1);
    const scaleY = resolution[1] / Math.max(displaySize[1], 1);
    const s = Math.min(scaleX, scaleY);

    setUniformVec2(gl, locations.uButtonCenterPx, params.buttonCenterXPx * scaleX, params.buttonCenterYPx * scaleY);
    setUniformVec2(gl, locations.uButtonSizePx, params.buttonWidthPx * scaleX, params.buttonHeightPx * scaleY);
    setUniformFloat(gl, locations.uButtonRadiusPx, params.buttonRadiusPx * s);
    setUniformFloat(gl, locations.uNoiseScale, params.noiseScale);
    setUniformFloat(gl, locations.uSwirlStrength, params.swirlStrength);
    setUniformFloat(gl, locations.uDriftSpeed, params.driftSpeed);
    setUniformFloat(gl, locations.uIdleAmount, params.idleAmount);
    setUniformFloat(gl, locations.uIdleReachPx, params.idleReachPx * s);
    setUniformVec2(gl, locations.uCenterSourceScale, params.centerSourceScaleX, params.centerSourceScaleY);
    setUniformFloat(gl, locations.uCenterFeatherPx, params.centerFeatherPx * s);
    setUniformFloat(gl, locations.uUnderOffsetPx, params.underOffsetPx * s);
    setUniformFloat(gl, locations.uUnderHeightPx, params.underHeightPx * s);
    setUniformFloat(gl, locations.uUnderPadPx, params.underPadPx * s);
    setUniformFloat(gl, locations.uWhooshRadiusPx, params.whooshRadiusPx * s);
    setUniformFloat(gl, locations.uWhooshFrontWidthPx, params.whooshFrontWidthPx * s);
    setUniformFloat(gl, locations.uDetachStartPx, params.detachStartPx * s);
    setUniformFloat(gl, locations.uDetachEndPx, params.detachEndPx * s);
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

vec2 normalizeOrZero(vec2 v) {
  float ls = dot(v, v);

  if (ls <= 1e-5) {
    return vec2(0.0);
  }

  return v * inversesqrt(ls);
}

float easeOutCubic(float x) {
  x = saturate(x);
  float y = 1.0 - x;
  return 1.0 - y * y * y;
}

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - r;
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
  vec2 idleDir = normalizeOrZero(mix(freeIdle, attachedIdle, attach * (0.55 + 0.45 * uSwirlStrength)));

  vec2 centerScalePx = max(halfSize * uCenterSourceScale, vec2(1.0));
  float centerN = length(local / centerScalePx) - 1.0;
  float centerDecay = exp(-max(centerN, 0.0) * 1.55);

  float boundaryEscape = smoothstep(-uCenterFeatherPx * 1.1, uCenterFeatherPx + feather * 3.0 + 10.0, dButton);
  float faceVisibility = mix(uInteriorOpacity, 1.0, boundaryEscape);

  vec2 idleSampleA = baseUv * 0.82
    - idleDir * (uTime * mix(0.08, 0.26, uDriftSpeed))
    + (flowA - 0.5) * (0.55 + 0.80 * uSwirlStrength);

  vec2 idleSampleB = baseUv * 1.58
    - idleDir * (uTime * mix(0.12, 0.42, uDriftSpeed))
    + (flowB - 0.5) * (0.72 + 1.00 * uSwirlStrength);

  float idleNoiseA = fbm(idleSampleA);
  float idleNoiseB = fbm(idleSampleB);
  float idleNoise = smoothstep(0.26, 0.92, mix(idleNoiseA, idleNoiseB, 0.45));

  float outsideD = max(dButton, 0.0);
  float idleFalloff = exp(-outsideD / max(uIdleReachPx, 1.0));
  float edgeCatch = smoothstep(-uCenterFeatherPx * 0.55, uCenterFeatherPx + feather * 2.0 + 12.0, dButton);
  float edgeResidue = exp(-outsideD / max(uIdleReachPx * 0.42, 1.0));
  float idleSource = max(centerDecay * 0.88, edgeCatch * edgeResidue * 0.82);

  float idleDensity =
    uIdleAmount *
    idleNoise *
    idleSource *
    mix(1.0, idleFalloff, 0.72) *
    faceVisibility *
    uIdleOpacity;

  float burstT = saturate(uBurstPhase);
  float attack = uBurstAmount * easeOutCubic(saturate(burstT / 0.16));
  float decay = 1.0 - smoothstep(0.10, 1.0, burstT);
  float burstEnv = attack * decay;

  float liftT = smoothstep(0.08, 0.62, burstT);

  vec2 underCenter = vec2(0.0, halfSize.y + uUnderOffsetPx);
  float underHalfLen = max(halfSize.x - radius + uUnderPadPx * (1.0 + attack * 0.35), 2.0);
  float underRadius = max(uUnderHeightPx * 0.5 * (1.0 + attack * 0.4), 1.0);

  float dUnder = sdCapsule(
    local,
    underCenter + vec2(-underHalfLen, 0.0),
    underCenter + vec2(underHalfLen, 0.0),
    underRadius
  );
  float underOut = max(dUnder, 0.0);

  vec2 fromUnder = local - underCenter;
  vec2 awayUnder = normalizeOrZero(fromUnder);
  vec2 awayButton = normalizeOrZero(mix(boundaryNormal, radialFromCenter, 0.42));
  vec2 up = vec2(0.0, -1.0);
  vec2 burstSpread = normalizeOrZero(mix(awayButton, awayUnder, 0.32));
  vec2 burstDir = normalizeOrZero(mix(burstSpread, up, (0.32 + 0.68 * liftT) * uRiseStrength));

  float frontR = mix(0.0, uWhooshRadiusPx, easeOutCubic(burstT));
  float frontW = mix(uWhooshFrontWidthPx * 0.6, uWhooshFrontWidthPx, liftT);
  float shapeOut = max(dButton, 0.0);
  float shapeFront = exp(-pow((shapeOut - frontR) / max(frontW, 1.0), 2.0));
  float shapeBody = exp(-shapeOut / max(uWhooshRadiusPx * 0.72, 1.0));
  float whooshFront = exp(-pow((underOut - frontR) / max(frontW, 1.0), 2.0));
  float whooshBody = exp(-underOut / max(uWhooshRadiusPx * 0.55, 1.0));

  vec2 burstFlow = (fbmVec2(baseUv * 0.95 + vec2(0.0, -uTime * 0.055)) - 0.5) *
    (0.65 + uSwirlStrength * 0.85);

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

  float centeredWhoosh = max(shapeBody * (burstEnv * 0.82), shapeFront * burstEnv);
  float undersideWhoosh = max(whooshBody * (burstEnv * 0.52), whooshFront * burstEnv * 0.74);

  float burstDensity =
    max(centeredWhoosh, undersideWhoosh) *
    burstNoise *
    riseMask *
    releaseMask *
    uBurstOpacity;

  float density = idleDensity + burstDensity;

  float hotspot = pow(saturate(density), 1.45);
  float glow = density * (0.18 + uGlowStrength * 0.48);
  glow += idleDensity * (0.08 + uGlowStrength * 0.18);
  glow += burstDensity * (0.08 + uGlowStrength * 0.22);

  vec3 color = mix(uTintA, uTintB, hotspot);
  color *= density * (0.90 + uGlowStrength * 0.32) + glow * 0.92;

  float alpha = density * (0.52 + uGlowStrength * 0.22) + glow * 0.48;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
