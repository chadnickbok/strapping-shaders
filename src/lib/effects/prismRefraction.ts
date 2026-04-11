import type { EffectDefinition } from "../types";
import { clamp, cssColorToRgba, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec4 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type PrismRefractionParams = {
  refraction: number;
  dispersion: number;
  edgeGlow: number;
  softness: number;
  tint: string;
  lensScale: number;
  opacity: number;
};

const DEFAULT_PARAMS: PrismRefractionParams = {
  refraction: 0.24,
  dispersion: 0.18,
  edgeGlow: 0.16,
  softness: 0.08,
  tint: "rgba(255,255,255,0.1)",
  lensScale: 0.42,
  opacity: 1
};

export const prismRefractionDefinition: EffectDefinition<PrismRefractionParams> = {
  effectId: "prism-refraction",
  displayName: "Prism Refraction",
  summary: "Glassy refraction with RGB dispersion, edge glow, and optional tint.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    { kind: "range", name: "refraction", label: "Refraction", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "dispersion", label: "Dispersion", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "edgeGlow", label: "Edge Glow", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "softness", label: "Softness", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "tint", label: "Tint" },
    { kind: "range", name: "lensScale", label: "Lens Scale", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uRefraction",
    "uDispersion",
    "uEdgeGlow",
    "uSoftness",
    "uTint",
    "uLensScale",
    "uOpacity",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      refraction: clamp(Number(params?.refraction ?? DEFAULT_PARAMS.refraction), 0, 1),
      dispersion: clamp(Number(params?.dispersion ?? DEFAULT_PARAMS.dispersion), 0, 1),
      edgeGlow: clamp(Number(params?.edgeGlow ?? DEFAULT_PARAMS.edgeGlow), 0, 1),
      softness: clamp(Number(params?.softness ?? DEFAULT_PARAMS.softness), 0, 1),
      tint: sanitizeCssColor(params?.tint, DEFAULT_PARAMS.tint),
      lensScale: clamp(Number(params?.lensScale ?? DEFAULT_PARAMS.lensScale), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    const [r, g, b, a] = cssColorToRgba(params.tint) ?? [1, 1, 1, 0.1];

    setUniformFloat(gl, locations.uRefraction, params.refraction);
    setUniformFloat(gl, locations.uDispersion, params.dispersion);
    setUniformFloat(gl, locations.uEdgeGlow, params.edgeGlow);
    setUniformFloat(gl, locations.uSoftness, params.softness);
    setUniformVec4(gl, locations.uTint, r, g, b, a);
    setUniformFloat(gl, locations.uLensScale, params.lensScale);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
    setUniformInt(gl, locations.uSourceImage, texture.unit);
    setUniformVec2(gl, locations.uImageResolution, texture.width, texture.height);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uTime;
uniform float uSeed;
uniform float uRefraction;
uniform float uDispersion;
uniform float uEdgeGlow;
uniform float uSoftness;
uniform vec4 uTint;
uniform float uLensScale;
uniform float uOpacity;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  centered.x *= uResolution.x / max(uResolution.y, 0.0001);
  float lensRadius = mix(0.75, 0.22, uLensScale);
  float lens = 1.0 - smoothstep(lensRadius, lensRadius + 0.2 + uSoftness * 0.3, length(centered));
  vec2 normalField = fbmVec2(centered * mix(1.5, 5.5, uLensScale) + vec2(uTime * 0.08, -uTime * 0.05) + uSeed * 9.0) - 0.5;
  vec2 normal = normalize(centered + normalField * 0.35 + vec2(0.0001));
  vec2 baseOffset = normal * lens * mix(0.0, 0.08, uRefraction);
  float dispersion = mix(0.0, 0.028, uDispersion);
  vec2 imageUv = coverUv(uv, uImageResolution, uResolution);

  float red = sampleClamped(uSourceImage, imageUv + baseOffset * (1.0 + dispersion)).r;
  float green = sampleClamped(uSourceImage, imageUv + baseOffset).g;
  float blue = sampleClamped(uSourceImage, imageUv + baseOffset * (1.0 - dispersion)).b;
  float alpha = sampleClamped(uSourceImage, imageUv).a;
  vec3 refracted = vec3(red, green, blue);

  float rim = smoothstep(0.18, 1.0, 1.0 - lens) * smoothstep(0.75, 0.05, abs(length(centered) - lensRadius));
  vec3 glow = vec3(1.0) * rim * (0.04 + uEdgeGlow * 0.22);
  vec3 color = refracted + uTint.rgb * uTint.a * lens + glow;

  outColor = vec4(clamp(color, 0.0, 1.0), alpha * uOpacity);
}
`
};
