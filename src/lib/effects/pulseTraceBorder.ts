import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import {
  applyBorderCoreUniforms,
  type BorderCoreParams,
  BORDER_CORE_UNIFORM_NAMES,
  BORDER_SHADER_UTILS,
  createBorderCoreControls,
  sanitizeBorderCoreParams
} from "./sharedBorder";

export type PulseTraceBorderParams = BorderCoreParams & {
  accentTint: string;
  packetCount: number;
  packetSize: number;
  packetSpeed: number;
  trailLength: number;
  cornerBloom: number;
  wobble: number;
};

const DEFAULT_PARAMS: PulseTraceBorderParams = {
  thicknessPx: 14,
  cornerRadiusPx: 28,
  insetPx: 12,
  tint: "#7ed8ff",
  glowStrength: 0.46,
  glowSpread: 0.38,
  accentTint: "#f8fbff",
  packetCount: 3,
  packetSize: 0.32,
  packetSpeed: 0.62,
  trailLength: 0.58,
  cornerBloom: 0.52,
  wobble: 0.28
};

export const pulseTraceBorderDefinition: EffectDefinition<PulseTraceBorderParams> = {
  effectId: "pulse-trace-border",
  displayName: "Pulse Trace Border",
  summary: "A bright rounded border with traveling packets, trails, and corner blooms.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    ...createBorderCoreControls<PulseTraceBorderParams>(),
    {
      kind: "color",
      name: "accentTint",
      label: "Accent Tint",
      description: "Optional packet highlight color."
    },
    {
      kind: "range",
      name: "packetCount",
      label: "Packet Count",
      min: 1,
      max: 5,
      step: 1,
      description: "How many luminous packets circulate around the frame."
    },
    {
      kind: "range",
      name: "packetSize",
      label: "Packet Size",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Head size for each perimeter packet."
    },
    {
      kind: "range",
      name: "packetSpeed",
      label: "Packet Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Travel speed around the border."
    },
    {
      kind: "range",
      name: "trailLength",
      label: "Trail Length",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How long the luminous trail lingers behind each packet."
    },
    {
      kind: "range",
      name: "cornerBloom",
      label: "Corner Bloom",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Extra intensity when packets round the corners."
    },
    {
      kind: "range",
      name: "wobble",
      label: "Wobble",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Mild jitter and width variation for a less rigid trace."
    }
  ],
  uniformNames: [
    ...BORDER_CORE_UNIFORM_NAMES,
    "uAccentTint",
    "uPacketCount",
    "uPacketSize",
    "uPacketSpeed",
    "uTrailLength",
    "uCornerBloom",
    "uWobble"
  ],
  sanitizeParams(params) {
    return {
      ...sanitizeBorderCoreParams(params, DEFAULT_PARAMS),
      accentTint: sanitizeHexColor(params?.accentTint, DEFAULT_PARAMS.accentTint),
      packetCount: clamp(Math.round(Number(params?.packetCount ?? DEFAULT_PARAMS.packetCount)), 1, 5),
      packetSize: clamp(Number(params?.packetSize ?? DEFAULT_PARAMS.packetSize), 0, 1),
      packetSpeed: clamp(Number(params?.packetSpeed ?? DEFAULT_PARAMS.packetSpeed), 0, 1),
      trailLength: clamp(Number(params?.trailLength ?? DEFAULT_PARAMS.trailLength), 0, 1),
      cornerBloom: clamp(Number(params?.cornerBloom ?? DEFAULT_PARAMS.cornerBloom), 0, 1),
      wobble: clamp(Number(params?.wobble ?? DEFAULT_PARAMS.wobble), 0, 1)
    };
  },
  applyUniforms(context) {
    applyBorderCoreUniforms(context);
    const { gl, locations, params } = context;
    const [r, g, b] = hexToRgb(params.accentTint);

    setUniformFloat(gl, locations.uPacketCount, params.packetCount);
    setUniformFloat(gl, locations.uPacketSize, params.packetSize);
    setUniformFloat(gl, locations.uPacketSpeed, params.packetSpeed);
    setUniformFloat(gl, locations.uTrailLength, params.trailLength);
    setUniformFloat(gl, locations.uCornerBloom, params.cornerBloom);
    setUniformFloat(gl, locations.uWobble, params.wobble);
    setUniformVec3(gl, locations.uAccentTint, r, g, b);
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
uniform vec3 uAccentTint;
uniform float uPacketCount;
uniform float uPacketSize;
uniform float uPacketSpeed;
uniform float uTrailLength;
uniform float uCornerBloom;
uniform float uWobble;

${BORDER_SHADER_UTILS}

float wrappedSignedDistance(float sampleCoord, float phase) {
  return fract(sampleCoord - phase + 0.5) - 0.5;
}

float traceCoreMask(float sdf, float thicknessPx, float featherPx) {
  float centerOffset = max(thicknessPx * 0.18, 0.75);
  float halfWidth = max(thicknessPx * 0.28, 1.0);
  return 1.0 - smoothstep(halfWidth - featherPx, halfWidth + featherPx, abs(sdf + centerOffset));
}

void main() {
  vec2 centered = gl_FragCoord.xy - 0.5 * uResolution;
  float strokeWidth = max(1.0, uThicknessPx);
  float glowSpreadPx = mix(8.0, 42.0, uGlowSpread);
  float frameInset = uInsetPx + strokeWidth * 0.34 + glowSpreadPx * 0.16;
  vec2 halfSize = max(vec2(18.0), 0.5 * uResolution - vec2(frameInset));
  float radius = clamp(uCornerRadiusPx, 0.0, max(min(halfSize.x, halfSize.y) - 1.0, 0.0));
  float sdf = sdRoundedRect(centered, halfSize, radius);
  float feather = aaWidth(sdf) * 1.15;
  float band = insideShellMask(sdf, 0.0, strokeWidth, feather * 1.15);
  float traceCore = traceCoreMask(sdf, strokeWidth, feather);
  float innerShell = insideShellMask(sdf, 0.0, strokeWidth * 1.45, feather * 1.4);
  float outerShell = outsideShellMask(sdf, 0.0, glowSpreadPx, feather * 1.8);
  float glowGate = smoothstep(-feather, feather * 2.4, sdf);
  float baseGlow = glowGate * glowFalloff(sdf, glowSpreadPx) * (0.12 + uGlowStrength * 0.46);

  vec2 boundary = roundedRectBoundaryPoint(centered, halfSize, radius);
  float perimeter = max(roundedRectPerimeter(halfSize, radius), 1.0);
  float path = roundedRectPerimeterCoord(boundary, halfSize, radius) / perimeter;
  float corner = pow(cornerWeight(boundary, halfSize, radius), 1.65);
  float pathNoise = fbm(vec2(path * 10.0 + uSeed * 4.3, uTime * 0.18));
  float localIntensity = mix(1.0, 0.86 + pathNoise * 0.26, uWobble);

  float packetField = 0.0;
  float highlightField = 0.0;
  float trailField = 0.0;
  float haloField = 0.0;
  float packetSpan = mix(0.012, 0.075, uPacketSize);
  float trailSpan = packetSpan + mix(0.03, 0.28, uTrailLength);
  float speed = mix(0.04, 0.38, uPacketSpeed);

  for (int index = 0; index < 5; index += 1) {
    if (float(index) >= uPacketCount) {
      continue;
    }

    float packetIndex = float(index);
    float noiseOffset = hash21(vec2(packetIndex + uSeed * 17.0, uSeed * 23.0));
    float wobbleNoise = noise(vec2(path * 20.0 + packetIndex * 5.1, uTime * 0.34 + noiseOffset * 9.0));
    float widthJitter = mix(1.0, 0.84 + wobbleNoise * 0.34, uWobble);
    float trailJitter = mix(1.0, 0.8 + wobbleNoise * 0.38, uWobble);
    float head = fract(packetIndex / uPacketCount + uTime * speed + noiseOffset * 0.18);
    float headDelta = abs(wrappedSignedDistance(path, head));
    float trailDelta = fract(head - path + 1.0);
    float headGlow = exp(-pow(headDelta / max(packetSpan * widthJitter, 0.001), 2.0) * 3.6);
    float trail = exp(-trailDelta / max(trailSpan * trailJitter, 0.001)) *
      (1.0 - smoothstep(trailSpan, trailSpan + 0.04, trailDelta));
    float cornerBoost = 1.0 + corner * (0.1 + uCornerBloom * 0.55);
    float halo = (trail * 0.5 + headGlow * 0.3) * corner * (0.08 + uCornerBloom * 0.46);

    packetField += headGlow;
    highlightField += headGlow * cornerBoost;
    trailField += trail * cornerBoost;
    haloField += halo;
  }

  float energizedBand = traceCore * localIntensity * (trailField * 0.58 + highlightField * 0.84);
  float trailGlow = outerShell * trailField * (0.1 + uGlowStrength * 0.34);
  float cornerHalo = outerShell * haloField;
  float lineBase = band * (0.14 + uGlowStrength * 0.08) + innerShell * 0.04;
  float accentMix = saturate(0.08 + highlightField * 0.16 + corner * 0.08);
  vec3 traceColor = mix(uTint, uAccentTint, accentMix);
  vec3 headColor = mix(uTint, uAccentTint, saturate(0.14 + packetField * 0.14));
  vec3 color = uTint * lineBase;
  color += uTint * baseGlow * 0.7;
  color += traceColor * (energizedBand + trailGlow + cornerHalo);
  color += headColor * packetField * traceCore * (0.12 + corner * uCornerBloom * 0.12);

  float alpha = lineBase * 0.56 + energizedBand * 0.98 + trailGlow * 0.42 + cornerHalo * 0.68 + baseGlow * 0.24;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
