import type { EffectDefinition } from "../types";
import { clamp } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type VhsPosterParams = {
  scanlines: number;
  chromaShift: number;
  jitter: number;
  noise: number;
  barrelWarp: number;
  glow: number;
  contrast: number;
};

const DEFAULT_PARAMS: VhsPosterParams = {
  scanlines: 0.3,
  chromaShift: 0.15,
  jitter: 0.1,
  noise: 0.14,
  barrelWarp: 0.08,
  glow: 0.1,
  contrast: 0.45
};

export const vhsPosterDefinition: EffectDefinition<VhsPosterParams> = {
  effectId: "vhs-poster",
  displayName: "VHS Poster",
  summary: "Analog video post-processing with scanlines, chroma shift, jitter, noise, and warp.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    { kind: "range", name: "scanlines", label: "Scanlines", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "chromaShift", label: "Chroma Shift", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "jitter", label: "Jitter", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "noise", label: "Noise", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "barrelWarp", label: "Barrel Warp", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "glow", label: "Glow", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uScanlines",
    "uChromaShift",
    "uJitter",
    "uNoise",
    "uBarrelWarp",
    "uGlow",
    "uContrast",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      scanlines: clamp(Number(params?.scanlines ?? DEFAULT_PARAMS.scanlines), 0, 1),
      chromaShift: clamp(Number(params?.chromaShift ?? DEFAULT_PARAMS.chromaShift), 0, 1),
      jitter: clamp(Number(params?.jitter ?? DEFAULT_PARAMS.jitter), 0, 1),
      noise: clamp(Number(params?.noise ?? DEFAULT_PARAMS.noise), 0, 1),
      barrelWarp: clamp(Number(params?.barrelWarp ?? DEFAULT_PARAMS.barrelWarp), 0, 1),
      glow: clamp(Number(params?.glow ?? DEFAULT_PARAMS.glow), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    setUniformFloat(gl, locations.uScanlines, params.scanlines);
    setUniformFloat(gl, locations.uChromaShift, params.chromaShift);
    setUniformFloat(gl, locations.uJitter, params.jitter);
    setUniformFloat(gl, locations.uNoise, params.noise);
    setUniformFloat(gl, locations.uBarrelWarp, params.barrelWarp);
    setUniformFloat(gl, locations.uGlow, params.glow);
    setUniformFloat(gl, locations.uContrast, params.contrast);
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
uniform float uScanlines;
uniform float uChromaShift;
uniform float uJitter;
uniform float uNoise;
uniform float uBarrelWarp;
uniform float uGlow;
uniform float uContrast;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float warpAmount = uBarrelWarp * 0.18;
  uv *= 1.0 + dot(uv, uv) * warpAmount;
  uv = uv * 0.5 + 0.5;
  uv.x += (noise(vec2(vUv.y * 64.0, uTime * 0.25 + uSeed * 3.0)) - 0.5) * uJitter * 0.03;
  vec2 imageUv = coverUv(uv, uImageResolution, uResolution);
  vec2 pixel = 1.0 / max(uImageResolution, vec2(1.0));
  float shift = uChromaShift * 2.8 * pixel.x;
  vec4 center = sampleClamped(uSourceImage, imageUv);
  float red = sampleClamped(uSourceImage, imageUv + vec2(shift, 0.0)).r;
  float green = center.g;
  float blue = sampleClamped(uSourceImage, imageUv - vec2(shift, 0.0)).b;
  vec3 color = vec3(red, green, blue);

  float scanline = sin(vUv.y * uResolution.y * PI) * 0.5 + 0.5;
  color *= 1.0 - uScanlines * 0.18 + scanline * uScanlines * 0.1;
  color += (noise(vUv * 320.0 + vec2(uTime * 0.02, uSeed * 17.0)) - 0.5) * uNoise * 0.16;
  color = mix(vec3(0.5), color, 0.82 + uContrast * 0.48);
  color += smoothstep(0.72, 1.0, luma(color)) * uGlow * 0.18;

  outColor = vec4(clamp(color, 0.0, 1.0), center.a);
}
`
};
