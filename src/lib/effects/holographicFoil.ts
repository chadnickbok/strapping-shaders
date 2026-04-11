import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_HSL_UTILS,
  GLSL_IMAGE_UTILS,
  OPTIONAL_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type HolographicFoilParams = {
  baseTint: string;
  iridescence: number;
  fresnel: number;
  scratch: number;
  sparkle: number;
  rotationDeg: number;
  opacity: number;
};

const DEFAULT_PARAMS: HolographicFoilParams = {
  baseTint: "#d9d9e6",
  iridescence: 0.65,
  fresnel: 0.5,
  scratch: 0.18,
  sparkle: 0.12,
  rotationDeg: 28,
  opacity: 1
};

export const holographicFoilDefinition: EffectDefinition<HolographicFoilParams> = {
  effectId: "holographic-foil",
  displayName: "Holographic Foil",
  summary: "Iridescent foil sheen with thin-film color, scratches, and optional image underlay.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [OPTIONAL_IMAGE_ASSET_SLOT],
  alphaMode: "opaque",
  controls: [
    { kind: "color", name: "baseTint", label: "Base Tint" },
    { kind: "range", name: "iridescence", label: "Iridescence", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "fresnel", label: "Fresnel", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "scratch", label: "Scratch", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "sparkle", label: "Sparkle", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "rotationDeg", label: "Rotation", min: 0, max: 180, step: 1 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uBaseTint",
    "uIridescence",
    "uFresnel",
    "uScratch",
    "uSparkle",
    "uRotationDeg",
    "uOpacity",
    "uHasSourceImage",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      baseTint: sanitizeCssColor(params?.baseTint, DEFAULT_PARAMS.baseTint),
      iridescence: clamp(Number(params?.iridescence ?? DEFAULT_PARAMS.iridescence), 0, 1),
      fresnel: clamp(Number(params?.fresnel ?? DEFAULT_PARAMS.fresnel), 0, 1),
      scratch: clamp(Number(params?.scratch ?? DEFAULT_PARAMS.scratch), 0, 1),
      sparkle: clamp(Number(params?.sparkle ?? DEFAULT_PARAMS.sparkle), 0, 1),
      rotationDeg: clamp(Number(params?.rotationDeg ?? DEFAULT_PARAMS.rotationDeg), 0, 180),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures, resolution }) {
    const [baseR, baseG, baseB] = hexToRgb(params.baseTint);
    const sourceImage = textures.sourceImage;

    setUniformVec3(gl, locations.uBaseTint, baseR, baseG, baseB);
    setUniformFloat(gl, locations.uIridescence, params.iridescence);
    setUniformFloat(gl, locations.uFresnel, params.fresnel);
    setUniformFloat(gl, locations.uScratch, params.scratch);
    setUniformFloat(gl, locations.uSparkle, params.sparkle);
    setUniformFloat(gl, locations.uRotationDeg, params.rotationDeg);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
    setUniformInt(gl, locations.uHasSourceImage, sourceImage ? 1 : 0);
    setUniformInt(gl, locations.uSourceImage, sourceImage?.unit ?? 0);
    setUniformVec2(
      gl,
      locations.uImageResolution,
      sourceImage?.width ?? resolution[0],
      sourceImage?.height ?? resolution[1]
    );
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uTime;
uniform float uSeed;
uniform vec3 uBaseTint;
uniform float uIridescence;
uniform float uFresnel;
uniform float uScratch;
uniform float uSparkle;
uniform float uRotationDeg;
uniform float uOpacity;
uniform int uHasSourceImage;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}
${GLSL_HSL_UTILS}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  centered.x *= uResolution.x / max(uResolution.y, 0.0001);
  vec2 rotated = rot2(radians(uRotationDeg)) * centered;
  float radial = length(centered) * 1.45;
  float fresnel = pow(saturate(1.0 - radial), mix(2.6, 0.9, uFresnel));
  float hue = fract(
    rotated.x * mix(0.55, 2.6, uIridescence) +
    fbm(rotated * 6.0 + vec2(uTime * 0.06, uSeed * 8.0)) * 0.4 +
    radial * (0.18 + uIridescence * 0.42)
  );
  vec3 film = hslToRgb(vec3(hue, 0.68 + uIridescence * 0.26, 0.58));

  float scratchNoise = noise(vec2(rotated.y * 180.0, rotated.x * 6.0 + uTime * 0.08));
  float scratchLines = pow(abs(sin(rotated.y * 220.0 + scratchNoise * 3.0)), 48.0);
  float scratchMask = scratchLines * (0.05 + uScratch * 0.28);

  float sparkleField = hash21(floor((uv + uSeed) * 64.0));
  float sparkle = step(0.985 - uSparkle * 0.05, sparkleField) * (0.08 + uSparkle * 0.4);

  vec3 base = uBaseTint * (0.55 + fresnel * 0.12);
  vec3 foil = mix(base, film, 0.22 + uIridescence * 0.62);
  foil += scratchMask;
  foil += sparkle * film;
  foil += fresnel * (0.1 + uFresnel * 0.38);

  vec3 underlay = base;

  if (uHasSourceImage == 1) {
    vec2 imageUv = coverUv(uv, uImageResolution, uResolution);
    underlay = sampleClamped(uSourceImage, imageUv).rgb;
  }

  vec3 color = mix(underlay, foil, 0.42 + uIridescence * 0.36);
  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
