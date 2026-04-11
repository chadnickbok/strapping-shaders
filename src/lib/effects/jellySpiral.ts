import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type JellySpiralParams = {
  turns: number;
  thickness: number;
  wobble: number;
  softness: number;
  pulse: number;
  tint: string;
  glow: number;
};

const DEFAULT_PARAMS: JellySpiralParams = {
  turns: 2.8,
  thickness: 0.22,
  wobble: 0.2,
  softness: 0.35,
  pulse: 0.18,
  tint: "#ff72c2",
  glow: 0.2
};

export const jellySpiralDefinition: EffectDefinition<JellySpiralParams> = {
  effectId: "jelly-spiral",
  displayName: "Jelly Spiral",
  summary: "A soft spiral ribbon with wobble, pulse, glow, and transparent falloff.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    { kind: "range", name: "turns", label: "Turns", min: 1, max: 6, step: 0.01 },
    { kind: "range", name: "thickness", label: "Thickness", min: 0.05, max: 0.5, step: 0.01 },
    { kind: "range", name: "wobble", label: "Wobble", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "softness", label: "Softness", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "pulse", label: "Pulse", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "tint", label: "Tint" },
    { kind: "range", name: "glow", label: "Glow", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uTurns",
    "uThickness",
    "uWobble",
    "uSoftness",
    "uPulse",
    "uTint",
    "uGlow"
  ],
  sanitizeParams(params) {
    return {
      turns: clamp(Number(params?.turns ?? DEFAULT_PARAMS.turns), 1, 6),
      thickness: clamp(Number(params?.thickness ?? DEFAULT_PARAMS.thickness), 0.05, 0.5),
      wobble: clamp(Number(params?.wobble ?? DEFAULT_PARAMS.wobble), 0, 1),
      softness: clamp(Number(params?.softness ?? DEFAULT_PARAMS.softness), 0, 1),
      pulse: clamp(Number(params?.pulse ?? DEFAULT_PARAMS.pulse), 0, 1),
      tint: sanitizeCssColor(params?.tint, DEFAULT_PARAMS.tint),
      glow: clamp(Number(params?.glow ?? DEFAULT_PARAMS.glow), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [r, g, b] = hexToRgb(params.tint);

    setUniformFloat(gl, locations.uTurns, params.turns);
    setUniformFloat(gl, locations.uThickness, params.thickness);
    setUniformFloat(gl, locations.uWobble, params.wobble);
    setUniformFloat(gl, locations.uSoftness, params.softness);
    setUniformFloat(gl, locations.uPulse, params.pulse);
    setUniformVec3(gl, locations.uTint, r, g, b);
    setUniformFloat(gl, locations.uGlow, params.glow);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uTurns;
uniform float uThickness;
uniform float uWobble;
uniform float uSoftness;
uniform float uPulse;
uniform vec3 uTint;
uniform float uGlow;

${GLSL_COMMON}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float radius = length(uv);
  float angle = atan(uv.y, uv.x);
  vec2 wobbleUv = uv * 3.4 + vec2(uTime * 0.18, -uTime * 0.12) + uSeed * 9.0;
  vec2 wobble = (fbmVec2(wobbleUv) - 0.5) * mix(0.0, 0.24, uWobble);
  vec2 warped = uv + wobble;
  radius = length(warped);
  angle = atan(warped.y, warped.x);

  float phase = angle / (2.0 * PI) + 0.5;
  float pulse = sin(uTime * (0.7 + uPulse * 2.1) + radius * 9.0 + uSeed * 6.0);
  float targetRadius = 0.1 + phase * (0.12 + uTurns * 0.11);
  targetRadius += pulse * (0.006 + uPulse * 0.022);
  float distanceToRibbon = abs(radius - targetRadius);
  float ribbonWidth = uThickness * 0.18;
  float feather = mix(0.002, 0.05, uSoftness);
  float ribbon = 1.0 - smoothstep(ribbonWidth, ribbonWidth + feather, distanceToRibbon);
  float core = 1.0 - smoothstep(ribbonWidth * 0.55, ribbonWidth * 0.55 + feather, distanceToRibbon);
  float halo = exp(-distanceToRibbon / max(0.01 + uGlow * 0.08, 0.001)) * (0.12 + uGlow * 0.42);
  float alpha = saturate(ribbon * 0.82 + halo);
  vec3 color = uTint * (0.45 + halo * 0.9 + core * 0.4);

  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
};
