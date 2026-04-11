import type { EffectDefinition } from "../types";
import { clamp } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type ThermalPalettePreset = "ironbow" | "whiteHot" | "lava" | "medical";

export type ThermalBloomParams = {
  palettePreset: ThermalPalettePreset;
  hotThreshold: number;
  contrast: number;
  contours: number;
  bloom: number;
  noise: number;
  opacity: number;
};

const THERMAL_PALETTES: ThermalPalettePreset[] = ["ironbow", "whiteHot", "lava", "medical"];

const DEFAULT_PARAMS: ThermalBloomParams = {
  palettePreset: "ironbow",
  hotThreshold: 0.72,
  contrast: 0.45,
  contours: 0.18,
  bloom: 0.2,
  noise: 0.05,
  opacity: 1
};

export const thermalBloomDefinition: EffectDefinition<ThermalBloomParams> = {
  effectId: "thermal-bloom",
  displayName: "Thermal Bloom",
  summary: "False-color thermal mapping with optional isotherm contours and hotspot bloom.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    {
      kind: "select",
      name: "palettePreset",
      label: "Palette Preset",
      options: THERMAL_PALETTES.map((value) => ({
        label: value,
        value
      }))
    },
    { kind: "range", name: "hotThreshold", label: "Hot Threshold", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contours", label: "Contours", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "bloom", label: "Bloom", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "noise", label: "Noise", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uPalettePreset",
    "uHotThreshold",
    "uContrast",
    "uContours",
    "uBloom",
    "uNoise",
    "uOpacity",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    const palettePreset = THERMAL_PALETTES.includes(params?.palettePreset as ThermalPalettePreset)
      ? (params?.palettePreset as ThermalPalettePreset)
      : DEFAULT_PARAMS.palettePreset;

    return {
      palettePreset,
      hotThreshold: clamp(Number(params?.hotThreshold ?? DEFAULT_PARAMS.hotThreshold), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      contours: clamp(Number(params?.contours ?? DEFAULT_PARAMS.contours), 0, 1),
      bloom: clamp(Number(params?.bloom ?? DEFAULT_PARAMS.bloom), 0, 1),
      noise: clamp(Number(params?.noise ?? DEFAULT_PARAMS.noise), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    setUniformFloat(gl, locations.uPalettePreset, THERMAL_PALETTES.indexOf(params.palettePreset));
    setUniformFloat(gl, locations.uHotThreshold, params.hotThreshold);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uContours, params.contours);
    setUniformFloat(gl, locations.uBloom, params.bloom);
    setUniformFloat(gl, locations.uNoise, params.noise);
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
uniform float uPalettePreset;
uniform float uHotThreshold;
uniform float uContrast;
uniform float uContours;
uniform float uBloom;
uniform float uNoise;
uniform float uOpacity;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

vec3 thermalPalette(float value, float paletteIndex) {
  if (paletteIndex < 0.5) {
    return mix(
      mix(vec3(0.1, 0.0, 0.18), vec3(0.78, 0.12, 0.18), smoothstep(0.0, 0.5, value)),
      vec3(1.0, 0.92, 0.42),
      smoothstep(0.45, 1.0, value)
    );
  }

  if (paletteIndex < 1.5) {
    return vec3(value);
  }

  if (paletteIndex < 2.5) {
    return mix(
      mix(vec3(0.14, 0.0, 0.02), vec3(0.74, 0.15, 0.02), smoothstep(0.0, 0.45, value)),
      vec3(1.0, 0.82, 0.32),
      smoothstep(0.42, 1.0, value)
    );
  }

  return mix(
    mix(vec3(0.0, 0.08, 0.18), vec3(0.0, 0.62, 0.76), smoothstep(0.0, 0.5, value)),
    vec3(0.92, 1.0, 1.0),
    smoothstep(0.52, 1.0, value)
  );
}

void main() {
  vec2 imageUv = coverUv(vUv, uImageResolution, uResolution);
  vec4 sampleColor = sampleClamped(uSourceImage, imageUv);
  float scalar = pow(luma(sampleColor.rgb), 0.65 + (1.0 - uContrast) * 1.2);
  scalar += (noise(vUv * 140.0 + uSeed * 29.0 + vec2(uTime * 0.02)) - 0.5) * uNoise * 0.12;
  scalar = saturate(scalar);

  vec3 color = thermalPalette(scalar, uPalettePreset);
  float contourPhase = abs(fract(scalar * mix(4.0, 16.0, uContours)) - 0.5);
  float contour = 1.0 - smoothstep(0.14, 0.26, contourPhase);
  color += contour * uContours * 0.12;

  float bloomMask = smoothstep(uHotThreshold - 0.08, uHotThreshold + 0.08, scalar);
  color += bloomMask * bloomMask * uBloom * 0.38;

  outColor = vec4(clamp(color, 0.0, 1.0), sampleColor.a * uOpacity);
}
`
};
