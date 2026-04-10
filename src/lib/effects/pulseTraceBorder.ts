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

void main() {
  vec2 centered = gl_FragCoord.xy - 0.5 * uResolution;
  vec2 halfSize = max(vec2(18.0), 0.5 * uResolution - vec2(uInsetPx));
  float radius = clamp(uCornerRadiusPx, 0.0, min(halfSize.x, halfSize.y) - 1.0);
  float sdf = sdRoundedRect(centered, halfSize, radius);
  float feather = aaWidth(sdf) * 1.15;
  float glowSpreadPx = mix(10.0, 58.0, uGlowSpread);
  float band = bandMask(sdf, max(1.0, uThicknessPx), feather);
  float innerShell = insideShellMask(sdf, 0.0, uThicknessPx * 1.4, feather * 1.45);
  float outerShell = outsideShellMask(sdf, 0.0, glowSpreadPx, feather * 1.8);
  float baseGlow = glowFalloff(sdf, glowSpreadPx) * (0.18 + uGlowStrength * 0.62);

  vec2 boundary = roundedRectBoundaryPoint(centered, halfSize, radius);
  float perimeter = roundedRectPerimeter(halfSize, radius);
  float path = roundedRectPerimeterCoord(boundary, halfSize, radius) / max(perimeter, 0.001);
  float corner = cornerWeight(boundary, halfSize, radius);
  float wobbleNoise = fbm(vec2(path * 12.0 + uSeed * 4.3, uTime * 0.22));
  float pathWobble = (wobbleNoise - 0.5) * mix(0.0, 0.03, uWobble);
  float pathWidth = bandMask(sdf, max(1.0, uThicknessPx) * (1.0 + (wobbleNoise - 0.5) * uWobble * 0.35), feather);

  float packetField = 0.0;
  float highlightField = 0.0;
  float trailField = 0.0;
  float packetSpan = mix(0.02, 0.1, uPacketSize);
  float trailSpan = packetSpan + mix(0.06, 0.35, uTrailLength);
  float speed = mix(0.05, 0.42, uPacketSpeed);

  for (int index = 0; index < 5; index += 1) {
    if (float(index) >= uPacketCount) {
      continue;
    }

    float packetIndex = float(index);
    float noiseOffset = hash21(vec2(packetIndex + uSeed * 17.0, uSeed * 23.0));
    float wobble = (noise(vec2(path * 18.0 + packetIndex * 3.7, uTime * 0.65 + noiseOffset * 11.0)) - 0.5) *
      mix(0.0, 0.06, uWobble);
    float head = fract(packetIndex / uPacketCount + uTime * speed + noiseOffset * 0.18 + pathWobble + wobble);
    float delta = fract(head - path + 1.0);
    float headGlow = exp(-pow(delta / max(packetSpan * 0.62, 0.001), 2.0) * 2.8);
    float trail = exp(-delta / max(trailSpan, 0.001)) * (1.0 - smoothstep(trailSpan, trailSpan + 0.06, delta));
    float cornerBoost = 1.0 + corner * (0.28 + uCornerBloom * 1.75);

    packetField += headGlow * cornerBoost;
    highlightField += headGlow * (1.2 + corner * uCornerBloom);
    trailField += trail * cornerBoost;
  }

  float energizedBand = pathWidth * (trailField * 0.44 + highlightField * 0.72);
  float cornerHalo = outerShell * trailField * corner * (0.12 + uCornerBloom * 0.55);
  float lineBase = band * (0.12 + uGlowStrength * 0.12) + innerShell * 0.05 + baseGlow * 0.12;
  vec3 trailColor = mix(uTint, uAccentTint, saturate(highlightField * 0.55 + corner * 0.3));
  vec3 color = uTint * lineBase;
  color += trailColor * (energizedBand + outerShell * trailField * (0.14 + uGlowStrength * 0.54) + cornerHalo);
  color += uAccentTint * packetField * (0.08 + corner * uCornerBloom * 0.18);

  float alpha = lineBase * 0.5 + energizedBand * 0.95 + outerShell * trailField * 0.26 + cornerHalo * 0.72;
  outColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`
};
