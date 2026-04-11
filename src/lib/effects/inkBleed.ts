import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type InkBleedParams = {
  threshold: number;
  spread: number;
  breakup: number;
  pooling: number;
  paperTexture: number;
  inkColor: string;
  paperTone: string;
};

const DEFAULT_PARAMS: InkBleedParams = {
  threshold: 0.5,
  spread: 0.12,
  breakup: 0.18,
  pooling: 0.16,
  paperTexture: 0.2,
  inkColor: "#2a221c",
  paperTone: "#f0e8da"
};

export const inkBleedDefinition: EffectDefinition<InkBleedParams> = {
  effectId: "ink-bleed",
  displayName: "Ink Bleed",
  summary: "Thresholded ink deposited into paper with bleed, breakup, and pooling.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "opaque",
  controls: [
    { kind: "range", name: "threshold", label: "Threshold", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "spread", label: "Spread", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "breakup", label: "Breakup", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "pooling", label: "Pooling", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "paperTexture", label: "Paper Texture", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "inkColor", label: "Ink Color" },
    { kind: "color", name: "paperTone", label: "Paper Tone" }
  ],
  uniformNames: [
    "uThreshold",
    "uSpread",
    "uBreakup",
    "uPooling",
    "uPaperTexture",
    "uInkColor",
    "uPaperTone",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      threshold: clamp(Number(params?.threshold ?? DEFAULT_PARAMS.threshold), 0, 1),
      spread: clamp(Number(params?.spread ?? DEFAULT_PARAMS.spread), 0, 1),
      breakup: clamp(Number(params?.breakup ?? DEFAULT_PARAMS.breakup), 0, 1),
      pooling: clamp(Number(params?.pooling ?? DEFAULT_PARAMS.pooling), 0, 1),
      paperTexture: clamp(Number(params?.paperTexture ?? DEFAULT_PARAMS.paperTexture), 0, 1),
      inkColor: sanitizeCssColor(params?.inkColor, DEFAULT_PARAMS.inkColor),
      paperTone: sanitizeCssColor(params?.paperTone, DEFAULT_PARAMS.paperTone)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const [inkR, inkG, inkB] = hexToRgb(params.inkColor);
    const [paperR, paperG, paperB] = hexToRgb(params.paperTone);
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    setUniformFloat(gl, locations.uThreshold, params.threshold);
    setUniformFloat(gl, locations.uSpread, params.spread);
    setUniformFloat(gl, locations.uBreakup, params.breakup);
    setUniformFloat(gl, locations.uPooling, params.pooling);
    setUniformFloat(gl, locations.uPaperTexture, params.paperTexture);
    setUniformVec3(gl, locations.uInkColor, inkR, inkG, inkB);
    setUniformVec3(gl, locations.uPaperTone, paperR, paperG, paperB);
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
uniform float uThreshold;
uniform float uSpread;
uniform float uBreakup;
uniform float uPooling;
uniform float uPaperTexture;
uniform vec3 uInkColor;
uniform vec3 uPaperTone;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

void main() {
  vec2 uv = vUv;
  vec2 sourceUv = coverUv(uv, uImageResolution, uResolution);
  vec2 pixel = 1.0 / max(uImageResolution, vec2(1.0));

  vec4 center = sampleClamped(uSourceImage, sourceUv);
  vec4 blur = center * 0.42;
  blur += sampleClamped(uSourceImage, sourceUv + vec2(pixel.x, 0.0)) * 0.145;
  blur += sampleClamped(uSourceImage, sourceUv - vec2(pixel.x, 0.0)) * 0.145;
  blur += sampleClamped(uSourceImage, sourceUv + vec2(0.0, pixel.y)) * 0.145;
  blur += sampleClamped(uSourceImage, sourceUv - vec2(0.0, pixel.y)) * 0.145;

  float sourceValue = 1.0 - luma(blur.rgb);
  float edgeNoise = fbm(uv * 12.0 + uSeed * 13.0 + vec2(uTime * 0.01));
  float edgeOffset = (edgeNoise - 0.5) * (0.06 + uBreakup * 0.24);
  float mask = smoothstep(
    uThreshold - (0.03 + uSpread * 0.22),
    uThreshold + (0.03 + uSpread * 0.22),
    sourceValue + edgeOffset
  );
  float pooled = pow(mask, 1.0 + uPooling * 2.4);

  float fiber = fbm(vec2(uv.x * 4.0, uv.y * 38.0) + vec2(uSeed * 4.0));
  float grain = noise(uv * 180.0 + uSeed * 71.0) - 0.5;
  vec3 paper = uPaperTone * (0.94 + fiber * 0.09 + grain * uPaperTexture * 0.16);
  vec3 ink = mix(uInkColor * 0.82, uInkColor * 1.04, pooled);
  vec3 color = mix(paper, ink, mask);

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
