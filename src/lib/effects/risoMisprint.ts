import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, hexToRgb, sanitizeCssColor, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3, setUniformVec3Array } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  MAX_SHARED_PALETTE_COLORS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type RisoMisprintParams = {
  inks: string[];
  dotScale: number;
  misregisterPx: number;
  bleed: number;
  paperTone: string;
  contrast: number;
  angleJitterDeg: number;
};

const DEFAULT_PARAMS: RisoMisprintParams = {
  inks: ["#00a7e1", "#ff4f9a", "#ffd166"],
  dotScale: 0.35,
  misregisterPx: 2,
  bleed: 0.12,
  paperTone: "#f5eddc",
  contrast: 0.5,
  angleJitterDeg: 4
};

export const risoMisprintDefinition: EffectDefinition<RisoMisprintParams> = {
  effectId: "riso-misprint",
  displayName: "Riso Misprint",
  summary: "Spot-color risograph simulation with halftone screens and plate misregistration.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "opaque",
  controls: [
    { kind: "palette", name: "inks", label: "Inks", minLength: 2, maxLength: 4 },
    { kind: "range", name: "dotScale", label: "Dot Scale", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "misregisterPx", label: "Misregister", min: 0, max: 12, step: 1 },
    { kind: "range", name: "bleed", label: "Bleed", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "paperTone", label: "Paper Tone" },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "angleJitterDeg", label: "Angle Jitter", min: 0, max: 15, step: 1 }
  ],
  uniformNames: [
    "uDotScale",
    "uMisregisterPx",
    "uBleed",
    "uPaperTone",
    "uContrast",
    "uAngleJitterDeg",
    "uInkCount",
    "uInks[0]",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      inks: sanitizePalette(params?.inks, DEFAULT_PARAMS.inks, 2, 4),
      dotScale: clamp(Number(params?.dotScale ?? DEFAULT_PARAMS.dotScale), 0, 1),
      misregisterPx: clamp(Number(params?.misregisterPx ?? DEFAULT_PARAMS.misregisterPx), 0, 12),
      bleed: clamp(Number(params?.bleed ?? DEFAULT_PARAMS.bleed), 0, 1),
      paperTone: sanitizeCssColor(params?.paperTone, DEFAULT_PARAMS.paperTone),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      angleJitterDeg: clamp(Number(params?.angleJitterDeg ?? DEFAULT_PARAMS.angleJitterDeg), 0, 15)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    const [paperR, paperG, paperB] = hexToRgb(params.paperTone);

    setUniformFloat(gl, locations.uDotScale, params.dotScale);
    setUniformFloat(gl, locations.uMisregisterPx, params.misregisterPx);
    setUniformFloat(gl, locations.uBleed, params.bleed);
    setUniformVec3(gl, locations.uPaperTone, paperR, paperG, paperB);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uAngleJitterDeg, params.angleJitterDeg);
    setUniformInt(gl, locations.uInkCount, params.inks.length);
    setUniformVec3Array(
      gl,
      locations["uInks[0]"],
      colorsToFloatArray(params.inks, MAX_SHARED_PALETTE_COLORS, DEFAULT_PARAMS.inks[0])
    );
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
uniform float uDotScale;
uniform float uMisregisterPx;
uniform float uBleed;
uniform vec3 uPaperTone;
uniform float uContrast;
uniform float uAngleJitterDeg;
uniform int uInkCount;
uniform vec3 uInks[${MAX_SHARED_PALETTE_COLORS}];
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

void main() {
  vec2 uv = vUv;
  vec2 baseUv = coverUv(uv, uImageResolution, uResolution);
  vec2 pixel = 1.0 / max(uImageResolution, vec2(1.0));
  float scale = mix(14.0, 62.0, uDotScale);
  vec3 color = uPaperTone;

  for (int index = 0; index < ${MAX_SHARED_PALETTE_COLORS}; index += 1) {
    if (index >= uInkCount) {
      continue;
    }

    float fi = float(index);
    float angle = radians(fi * 32.0 + (fi - 1.5) * uAngleJitterDeg);
    vec2 offset = rot2(angle) * vec2(uMisregisterPx * pixel.x * (fi - 1.0), uMisregisterPx * pixel.y * (1.5 - fi));
    vec4 sampleColor = sampleClamped(uSourceImage, baseUv + offset);
    float value = pow(1.0 - luma(sampleColor.rgb), 0.9 + uContrast * 1.4);
    vec2 screenUv = rot2(angle) * ((uv - 0.5) * scale * 10.0);
    float pattern = 0.5 + 0.5 * sin(screenUv.x) * sin(screenUv.y);
    float coverage = smoothstep(pattern - 0.12 - uBleed * 0.18, pattern + 0.08 + uBleed * 0.12, value);
    color = mix(color, color * (1.0 - uInks[index] * 0.65), coverage);
  }

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
