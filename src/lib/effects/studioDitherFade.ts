import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON, GLSL_IMAGE_UTILS, REQUIRED_IMAGE_ASSET_SLOT } from "./sharedShaderUtils";

export type StudioDitherFadeParams = {
  fade: number;
  pixelSize: number;
  patternMix: number;
  quantize: number;
  contrast: number;
  paperGrain: number;
  paperTint: string;
  shadowTint: string;
};

const DEFAULT_PARAMS: StudioDitherFadeParams = {
  fade: 0.74,
  pixelSize: 0.34,
  patternMix: 0.66,
  quantize: 0.42,
  contrast: 0.5,
  paperGrain: 0.24,
  paperTint: "#f3efe3",
  shadowTint: "#151515"
};

export const studioDitherFadeDefinition: EffectDefinition<StudioDitherFadeParams> = {
  effectId: "studio-dither-fade",
  displayName: "Studio Dither Fade",
  summary: "Editorial ordered-dither image treatment with progressive reveal, quantized tone, and paper texture.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "opaque",
  controls: [
    {
      kind: "range",
      name: "fade",
      label: "Fade",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall reveal amount before the image resolves toward full coverage."
    },
    {
      kind: "range",
      name: "pixelSize",
      label: "Pixel Size",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Size of the internal dither cells."
    },
    {
      kind: "range",
      name: "patternMix",
      label: "Pattern Mix",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Blend between structured Bayer thresholds and noisier thresholds."
    },
    {
      kind: "range",
      name: "quantize",
      label: "Quantize",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Palette reduction strength before dithering."
    },
    {
      kind: "range",
      name: "contrast",
      label: "Contrast",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Tonal push applied before quantization."
    },
    {
      kind: "range",
      name: "paperGrain",
      label: "Paper Grain",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Strength of the paper texture under the dithered image."
    },
    {
      kind: "color",
      name: "paperTint",
      label: "Paper Tint"
    },
    {
      kind: "color",
      name: "shadowTint",
      label: "Shadow Tint"
    }
  ],
  uniformNames: [
    "uFade",
    "uPixelSize",
    "uPatternMix",
    "uQuantize",
    "uContrast",
    "uPaperGrain",
    "uPaperTint",
    "uShadowTint",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      fade: clamp(Number(params?.fade ?? DEFAULT_PARAMS.fade), 0, 1),
      pixelSize: clamp(Number(params?.pixelSize ?? DEFAULT_PARAMS.pixelSize), 0, 1),
      patternMix: clamp(Number(params?.patternMix ?? DEFAULT_PARAMS.patternMix), 0, 1),
      quantize: clamp(Number(params?.quantize ?? DEFAULT_PARAMS.quantize), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      paperGrain: clamp(Number(params?.paperGrain ?? DEFAULT_PARAMS.paperGrain), 0, 1),
      paperTint: sanitizeCssColor(params?.paperTint, DEFAULT_PARAMS.paperTint),
      shadowTint: sanitizeCssColor(params?.shadowTint, DEFAULT_PARAMS.shadowTint)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    const [paperR, paperG, paperB] = hexToRgb(params.paperTint);
    const [shadowR, shadowG, shadowB] = hexToRgb(params.shadowTint);

    setUniformFloat(gl, locations.uFade, params.fade);
    setUniformFloat(gl, locations.uPixelSize, params.pixelSize);
    setUniformFloat(gl, locations.uPatternMix, params.patternMix);
    setUniformFloat(gl, locations.uQuantize, params.quantize);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uPaperGrain, params.paperGrain);
    setUniformVec3(gl, locations.uPaperTint, paperR, paperG, paperB);
    setUniformVec3(gl, locations.uShadowTint, shadowR, shadowG, shadowB);
    setUniformInt(gl, locations.uSourceImage, texture.unit);
    setUniformVec2(gl, locations.uImageResolution, texture.width, texture.height);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uSeed;
uniform float uFade;
uniform float uPixelSize;
uniform float uPatternMix;
uniform float uQuantize;
uniform float uContrast;
uniform float uPaperGrain;
uniform vec3 uPaperTint;
uniform vec3 uShadowTint;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

float bayer8(vec2 p) {
  int x = int(mod(p.x, 8.0));
  int y = int(mod(p.y, 8.0));
  int index = y * 8 + x;
  float values[64] = float[](
    0.0, 48.0, 12.0, 60.0, 3.0, 51.0, 15.0, 63.0,
    32.0, 16.0, 44.0, 28.0, 35.0, 19.0, 47.0, 31.0,
    8.0, 56.0, 4.0, 52.0, 11.0, 59.0, 7.0, 55.0,
    40.0, 24.0, 36.0, 20.0, 43.0, 27.0, 39.0, 23.0,
    2.0, 50.0, 14.0, 62.0, 1.0, 49.0, 13.0, 61.0,
    34.0, 18.0, 46.0, 30.0, 33.0, 17.0, 45.0, 29.0,
    10.0, 58.0, 6.0, 54.0, 9.0, 57.0, 5.0, 53.0,
    42.0, 26.0, 38.0, 22.0, 41.0, 25.0, 37.0, 21.0
  );
  return (values[index] + 0.5) / 64.0;
}

void main() {
  float cellPx = max(1.0, floor(mix(1.0, 8.0, uPixelSize)));
  vec2 cellCoord = floor(gl_FragCoord.xy / cellPx);
  vec2 samplePx = (cellCoord + 0.5) * cellPx;
  vec2 sampleUv = clamp(samplePx / uResolution, 0.0, 1.0);
  vec2 imageUv = coverUv(sampleUv, uImageResolution, uResolution);
  vec4 source = sampleClamped(uSourceImage, imageUv);
  vec3 color = mix(vec3(0.5), source.rgb, 0.65 + uContrast * 0.7);
  float levels = floor(mix(8.0, 3.0, uQuantize));
  float denominator = max(levels - 1.0, 1.0);
  float bayer = bayer8(cellCoord);
  float noiseThreshold = hash21(cellCoord + uSeed * 97.3);
  float threshold = mix(bayer, noiseThreshold, uPatternMix);
  vec3 dithered = floor((color + (threshold - 0.5) / max(levels, 1.0)) * denominator + 0.5) / denominator;
  float lum = luma(color);
  float coverage = smoothstep(threshold - 0.18, threshold + 0.18, uFade * (0.28 + lum * (0.92 + uContrast * 0.38)));
  float grain = (hash21(gl_FragCoord.xy * 0.5 + uSeed * 19.1) - 0.5) * mix(0.0, 0.18, uPaperGrain);
  vec3 paper = clamp(uPaperTint + grain, 0.0, 1.0);
  vec3 ink = mix(uShadowTint, dithered, smoothstep(0.08, 0.72, luma(dithered)));
  vec3 finalColor = mix(paper, ink, coverage);
  outColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`
};
