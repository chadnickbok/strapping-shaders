import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { GLSL_COMMON, MAX_SHARED_PALETTE_COLORS } from "./sharedShaderUtils";

export type FlowingGradientParams = {
  palette: string[];
  flow: number;
  waveHeight: number;
  separation: number;
  softness: number;
  contrast: number;
  grain: number;
  opacity: number;
};

const DEFAULT_PARAMS: FlowingGradientParams = {
  palette: ["#1d1736", "#52307c", "#c76e2a", "#f4d37b"],
  flow: 0.42,
  waveHeight: 0.54,
  separation: 0.52,
  softness: 0.58,
  contrast: 0.44,
  grain: 0.08,
  opacity: 1
};

export const flowingGradientDefinition: EffectDefinition<FlowingGradientParams> = {
  effectId: "flowing-gradient",
  displayName: "Flowing Gradient",
  summary: "Stacked drifting gradient bands inspired by wave masks, simplex-style flow, and palette-mapped lightness.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "palette",
      name: "palette",
      label: "Palette",
      minLength: 3,
      maxLength: MAX_SHARED_PALETTE_COLORS,
      description: "Ordered gradient ramp mapped across the drifting lightness field."
    },
    {
      kind: "range",
      name: "flow",
      label: "Flow",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall drift speed of the stacked noise layers."
    },
    {
      kind: "range",
      name: "waveHeight",
      label: "Wave Height",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Amplitude of the two main wave boundaries."
    },
    {
      kind: "range",
      name: "separation",
      label: "Separation",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Vertical spacing between the wave layers."
    },
    {
      kind: "range",
      name: "softness",
      label: "Softness",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Blur and edge softness of the wave masks."
    },
    {
      kind: "range",
      name: "contrast",
      label: "Contrast",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Expands or compresses the palette-mapped lightness range."
    },
    {
      kind: "range",
      name: "grain",
      label: "Grain",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Subtle finish grain over the final surface."
    },
    {
      kind: "range",
      name: "opacity",
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.01
    }
  ],
  uniformNames: [
    "uFlow",
    "uWaveHeight",
    "uSeparation",
    "uSoftness",
    "uContrast",
    "uGrain",
    "uOpacity",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 3, MAX_SHARED_PALETTE_COLORS),
      flow: clamp(Number(params?.flow ?? DEFAULT_PARAMS.flow), 0, 1),
      waveHeight: clamp(Number(params?.waveHeight ?? DEFAULT_PARAMS.waveHeight), 0, 1),
      separation: clamp(Number(params?.separation ?? DEFAULT_PARAMS.separation), 0, 1),
      softness: clamp(Number(params?.softness ?? DEFAULT_PARAMS.softness), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      grain: clamp(Number(params?.grain ?? DEFAULT_PARAMS.grain), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uFlow, params.flow);
    setUniformFloat(gl, locations.uWaveHeight, params.waveHeight);
    setUniformFloat(gl, locations.uSeparation, params.separation);
    setUniformFloat(gl, locations.uSoftness, params.softness);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uGrain, params.grain);
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
uniform float uFlow;
uniform float uWaveHeight;
uniform float uSeparation;
uniform float uSoftness;
uniform float uContrast;
uniform float uGrain;
uniform float uOpacity;
uniform int uPaletteCount;
uniform vec3 uPalette[6];

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

float layeredNoise(vec2 p, float time, float offset) {
  float xShift = time * mix(0.05, 0.24, uFlow);
  float sum = 0.5;
  sum += fbm(vec2(p.x * 1.35 + xShift * 1.1 + offset, p.y * 1.00 - offset * 0.3)) * 0.34;
  sum += fbm(vec2(p.x * 0.82 - xShift * 0.6 - offset * 0.2, p.y * 0.84 + offset)) * 0.24;
  sum += fbm(vec2(p.x * 0.46 + xShift * 0.8 + offset * 1.3, p.y * 0.66 - offset * 0.7)) * 0.18;
  return clamp(sum, 0.0, 1.0);
}

float waveCurve(float x, float time, float offset) {
  float sum = 0.0;
  sum += noise(vec2(x * 1.34 + time * 0.22 + offset, time * 0.11 + offset * 0.3)) * 0.9;
  sum += noise(vec2(x * 0.88 + time * 0.18 - offset * 0.4, time * 0.07)) * 0.7;
  sum += noise(vec2(x * 0.52 - time * 0.15 + offset, time * 0.05 + offset * 0.1)) * 0.45;
  return sum / 2.05 - 0.5;
}

float waveMask(float y, float center, float softness, float blurMod) {
  float blur = softness * blurMod;
  return 1.0 - smoothstep(center - blur, center + blur, y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 fieldUv = vec2(
    (uv.x - 0.5) * (uResolution.x / max(uResolution.y, 0.0001)),
    uv.y * 3.4
  );
  float time = uTime + uSeed * 37.0;
  float bg = layeredNoise(fieldUv, time + 19.0, 0.4);
  float w2 = layeredNoise(fieldUv + vec2(0.08, -0.16), time + 73.0, 1.3);
  float w1 = layeredNoise(fieldUv + vec2(-0.04, 0.12), time + 131.0, -0.9);

  float amplitude = mix(0.03, 0.17, uWaveHeight);
  float baseY1 = 0.54 + waveCurve(fieldUv.x, time + 17.0, 0.8) * amplitude;
  float separation = mix(0.12, 0.34, uSeparation);
  float baseY2 = baseY1 - separation + waveCurve(fieldUv.x, time + 49.0, 2.1) * amplitude * 0.76;
  float softness = mix(0.02, 0.16, uSoftness);
  float blur1 = mix(0.8, 1.5, layeredNoise(fieldUv * 0.8, time, 0.2));
  float blur2 = mix(0.7, 1.4, layeredNoise(fieldUv * 0.7, time + 11.0, -0.6));
  float alpha2 = waveMask(uv.y, baseY2, softness, blur2);
  float alpha1 = waveMask(uv.y, baseY1, softness, blur1);

  float lightness = bg;
  lightness = mix(lightness, w2, alpha2);
  lightness = mix(lightness, w1, alpha1);
  lightness = pow(clamp(lightness, 0.0, 1.0), mix(1.35, 0.72, uContrast));
  vec3 color = paletteAt(lightness);
  float sheen = smoothstep(0.55, 1.0, lightness) * 0.08;
  color += sheen;
  color += (hash21(gl_FragCoord.xy * 0.5 + uSeed * 17.0) - 0.5) * mix(0.0, 0.08, uGrain);

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
