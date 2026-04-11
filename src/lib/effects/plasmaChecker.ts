import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { GLSL_COMMON, MAX_SHARED_PALETTE_COLORS } from "./sharedShaderUtils";

export type PlasmaCheckerParams = {
  palette: string[];
  gridScale: number;
  warp: number;
  contrast: number;
  softness: number;
  speed: number;
  opacity: number;
};

const DEFAULT_PARAMS: PlasmaCheckerParams = {
  palette: ["#201a3a", "#5b5fef", "#ffd166"],
  gridScale: 0.42,
  warp: 0.48,
  contrast: 0.52,
  softness: 0.18,
  speed: 0.2,
  opacity: 1
};

export const plasmaCheckerDefinition: EffectDefinition<PlasmaCheckerParams> = {
  effectId: "plasma-checker",
  displayName: "Plasma Checker",
  summary: "Domain-warped checker plasma with palette mapping and animated pattern flow.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    { kind: "palette", name: "palette", label: "Palette", minLength: 2, maxLength: 5 },
    { kind: "range", name: "gridScale", label: "Grid Scale", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "warp", label: "Warp", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "softness", label: "Softness", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "speed", label: "Speed", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uGridScale",
    "uWarp",
    "uContrast",
    "uSoftness",
    "uSpeed",
    "uOpacity",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 2, 5),
      gridScale: clamp(Number(params?.gridScale ?? DEFAULT_PARAMS.gridScale), 0, 1),
      warp: clamp(Number(params?.warp ?? DEFAULT_PARAMS.warp), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      softness: clamp(Number(params?.softness ?? DEFAULT_PARAMS.softness), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uGridScale, params.gridScale);
    setUniformFloat(gl, locations.uWarp, params.warp);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uSoftness, params.softness);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
    setUniformInt(gl, locations.uPaletteCount, palette.length);
    setUniformVec3Array(
      gl,
      locations["uPalette[0]"],
      colorsToFloatArray(palette, MAX_SHARED_PALETTE_COLORS, DEFAULT_PARAMS.palette[0])
    );
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uGridScale;
uniform float uWarp;
uniform float uContrast;
uniform float uSoftness;
uniform float uSpeed;
uniform float uOpacity;
uniform int uPaletteCount;
uniform vec3 uPalette[${MAX_SHARED_PALETTE_COLORS}];

${GLSL_COMMON}

vec3 paletteAt(float t) {
  float segments = float(max(uPaletteCount - 1, 1));
  float scaled = clamp(t, 0.0, 0.9999) * segments;
  int index = int(floor(scaled));
  float blend = fract(scaled);
  vec3 startColor = uPalette[index];
  vec3 endColor = uPalette[min(index + 1, uPaletteCount - 1)];
  return mix(startColor, endColor, blend);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float scale = mix(2.8, 12.0, uGridScale);
  float speed = mix(0.0, 0.36, uSpeed);
  vec2 base = uv * scale;
  vec2 warp = (fbmVec2(base * 0.85 + uSeed * 17.0 + uTime * speed) - 0.5) * mix(0.0, 2.2, uWarp);
  vec2 warped = base + warp;
  float checker = sin(warped.x * PI) * sin(warped.y * PI);
  float plasma = sin(warped.x * 2.6 + uTime * speed * 2.2) + cos(warped.y * 3.1 - uTime * speed * 1.7);
  float value = checker * 0.55 + plasma * 0.18;
  value = value * (0.8 + uContrast * 1.1);
  float softened = smoothstep(-0.9 - uSoftness, 0.9 + uSoftness, value);
  vec3 color = paletteAt(softened);
  color *= 0.84 + (1.0 - abs(checker)) * 0.32;
  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
