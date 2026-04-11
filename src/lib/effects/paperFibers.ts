import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type PaperFibersParams = {
  paperTone: string;
  fiberStrength: number;
  blotches: number;
  emboss: number;
  grain: number;
  fiberAngleDeg: number;
  opacity: number;
};

const DEFAULT_PARAMS: PaperFibersParams = {
  paperTone: "#f2eadf",
  fiberStrength: 0.22,
  blotches: 0.12,
  emboss: 0.1,
  grain: 0.14,
  fiberAngleDeg: 12,
  opacity: 1
};

export const paperFibersDefinition: EffectDefinition<PaperFibersParams> = {
  effectId: "paper-fibers",
  displayName: "Paper Fibers",
  summary: "Procedural paper stock with directional fibers, blotches, emboss, and grain.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    { kind: "color", name: "paperTone", label: "Paper Tone" },
    { kind: "range", name: "fiberStrength", label: "Fiber Strength", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "blotches", label: "Blotches", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "emboss", label: "Emboss", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "grain", label: "Grain", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "fiberAngleDeg", label: "Fiber Angle", min: 0, max: 180, step: 1 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uPaperTone",
    "uFiberStrength",
    "uBlotches",
    "uEmboss",
    "uGrain",
    "uFiberAngleDeg",
    "uOpacity"
  ],
  sanitizeParams(params) {
    return {
      paperTone: sanitizeCssColor(params?.paperTone, DEFAULT_PARAMS.paperTone),
      fiberStrength: clamp(Number(params?.fiberStrength ?? DEFAULT_PARAMS.fiberStrength), 0, 1),
      blotches: clamp(Number(params?.blotches ?? DEFAULT_PARAMS.blotches), 0, 1),
      emboss: clamp(Number(params?.emboss ?? DEFAULT_PARAMS.emboss), 0, 1),
      grain: clamp(Number(params?.grain ?? DEFAULT_PARAMS.grain), 0, 1),
      fiberAngleDeg: clamp(Number(params?.fiberAngleDeg ?? DEFAULT_PARAMS.fiberAngleDeg), 0, 180),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [r, g, b] = hexToRgb(params.paperTone);

    setUniformVec3(gl, locations.uPaperTone, r, g, b);
    setUniformFloat(gl, locations.uFiberStrength, params.fiberStrength);
    setUniformFloat(gl, locations.uBlotches, params.blotches);
    setUniformFloat(gl, locations.uEmboss, params.emboss);
    setUniformFloat(gl, locations.uGrain, params.grain);
    setUniformFloat(gl, locations.uFiberAngleDeg, params.fiberAngleDeg);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uSeed;
uniform vec3 uPaperTone;
uniform float uFiberStrength;
uniform float uBlotches;
uniform float uEmboss;
uniform float uGrain;
uniform float uFiberAngleDeg;
uniform float uOpacity;

${GLSL_COMMON}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution.xy, vec2(1.0));
  vec2 rotated = rot2(radians(uFiberAngleDeg)) * (uv * 2.0 - 1.0);
  float longFiber = noise(vec2(rotated.x * 180.0, rotated.y * 5.0) + uSeed * 11.0);
  float shortFiber = noise(vec2(rotated.x * 520.0, rotated.y * 16.0) + uSeed * 23.0);
  float fibers = mix(longFiber, shortFiber, 0.42) - 0.5;
  float blotches = fbm(uv * 3.2 + uSeed * 4.0) - 0.5;
  float grain = noise(uv * 280.0 + uSeed * 71.0) - 0.5;
  float emboss = (noise(vec2(rotated.x * 260.0 + 0.004, rotated.y * 8.0)) - longFiber) * uEmboss;

  vec3 color = uPaperTone;
  color *= 0.97 + blotches * (0.12 + uBlotches * 0.16);
  color += fibers * uFiberStrength * 0.18;
  color += emboss * 0.16;
  color += grain * uGrain * 0.12;

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
