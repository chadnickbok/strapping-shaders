import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { GLSL_COMMON, MAX_SHARED_PALETTE_COLORS } from "./sharedShaderUtils";

export type VelvetMeshParams = {
  palette: string[];
  pointSpread: number;
  drift: number;
  grain: number;
  vignette: number;
  contrast: number;
  opacity: number;
};

const DEFAULT_PARAMS: VelvetMeshParams = {
  palette: ["#1c2e59", "#32746d", "#f2c14e", "#ee6c4d"],
  pointSpread: 0.55,
  drift: 0.18,
  grain: 0.12,
  vignette: 0.1,
  contrast: 0.4,
  opacity: 1
};

export const velvetMeshDefinition: EffectDefinition<VelvetMeshParams> = {
  effectId: "velvet-mesh",
  displayName: "Velvet Mesh",
  summary: "Mesh-gradient style color field with slow drift, grain, and restrained vignette.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    { kind: "palette", name: "palette", label: "Palette", minLength: 3, maxLength: 6 },
    { kind: "range", name: "pointSpread", label: "Point Spread", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "drift", label: "Drift", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "grain", label: "Grain", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uPointSpread",
    "uDrift",
    "uGrain",
    "uVignette",
    "uContrast",
    "uOpacity",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 3, 6),
      pointSpread: clamp(Number(params?.pointSpread ?? DEFAULT_PARAMS.pointSpread), 0, 1),
      drift: clamp(Number(params?.drift ?? DEFAULT_PARAMS.drift), 0, 1),
      grain: clamp(Number(params?.grain ?? DEFAULT_PARAMS.grain), 0, 1),
      vignette: clamp(Number(params?.vignette ?? DEFAULT_PARAMS.vignette), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uPointSpread, params.pointSpread);
    setUniformFloat(gl, locations.uDrift, params.drift);
    setUniformFloat(gl, locations.uGrain, params.grain);
    setUniformFloat(gl, locations.uVignette, params.vignette);
    setUniformFloat(gl, locations.uContrast, params.contrast);
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
uniform float uPointSpread;
uniform float uDrift;
uniform float uGrain;
uniform float uVignette;
uniform float uContrast;
uniform float uOpacity;
uniform int uPaletteCount;
uniform vec3 uPalette[${MAX_SHARED_PALETTE_COLORS}];

${GLSL_COMMON}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution.xy, vec2(1.0));
  vec2 centered = uv * 2.0 - 1.0;
  float spread = mix(0.22, 0.9, uPointSpread);
  float drift = uTime * mix(0.0, 0.08, uDrift);
  vec3 numerator = vec3(0.0);
  float denominator = 0.0;

  for (int index = 0; index < ${MAX_SHARED_PALETTE_COLORS}; index += 1) {
    if (index >= uPaletteCount) {
      continue;
    }

    float fi = float(index);
    vec2 point = vec2(
      sin(fi * 1.7 + uSeed * 9.0 + drift * (0.8 + fi * 0.2)),
      cos(fi * 2.1 + uSeed * 7.0 - drift * (0.6 + fi * 0.15))
    ) * vec2(0.72, 0.62);
    float distanceToPoint = length(centered - point);
    float weight = 1.0 / pow(max(distanceToPoint, 0.08), mix(1.8, 0.7, spread));
    numerator += uPalette[index] * weight;
    denominator += weight;
  }

  vec3 color = numerator / max(denominator, 0.001);
  color = mix(vec3(0.5), color, 0.82 + uContrast * 0.48);
  float grain = noise(uv * 280.0 + uSeed * 13.0) - 0.5;
  color += grain * uGrain * 0.12;
  float vignette = 1.0 - smoothstep(0.35, 1.1, length(centered));
  color *= 1.0 - uVignette * (1.0 - vignette) * 0.42;

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
