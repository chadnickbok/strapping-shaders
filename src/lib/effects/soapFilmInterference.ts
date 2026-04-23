import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  OPTIONAL_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type SoapFilmInterferenceParams = {
  baseTint: string;
  thickness: number;
  iridescence: number;
  fresnel: number;
  distortion: number;
  drift: number;
  opacity: number;
};

const DEFAULT_PARAMS: SoapFilmInterferenceParams = {
  baseTint: "#dfe7f3",
  thickness: 0.54,
  iridescence: 0.74,
  fresnel: 0.58,
  distortion: 0.3,
  drift: 0.28,
  opacity: 0.82
};

export const soapFilmInterferenceDefinition: EffectDefinition<SoapFilmInterferenceParams> = {
  effectId: "soap-film-interference",
  displayName: "Soap Film Interference",
  summary: "Thin-film inspired iridescence with thickness variation, Fresnel lift, and optional image underlay.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [OPTIONAL_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    {
      kind: "color",
      name: "baseTint",
      label: "Base Tint",
      description: "Neutral body tint under the interference colors."
    },
    {
      kind: "range",
      name: "thickness",
      label: "Thickness",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Mean thin-film thickness used for the hue shift."
    },
    {
      kind: "range",
      name: "iridescence",
      label: "Iridescence",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Strength of the angular hue travel."
    },
    {
      kind: "range",
      name: "fresnel",
      label: "Fresnel",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Edge reflectance emphasis."
    },
    {
      kind: "range",
      name: "distortion",
      label: "Distortion",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Thickness variation and local wobble in the film."
    },
    {
      kind: "range",
      name: "drift",
      label: "Drift",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Animation speed for the thickness field."
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
    "uBaseTint",
    "uThickness",
    "uIridescence",
    "uFresnel",
    "uDistortion",
    "uDrift",
    "uOpacity",
    "uHasSourceImage",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      baseTint: sanitizeCssColor(params?.baseTint, DEFAULT_PARAMS.baseTint),
      thickness: clamp(Number(params?.thickness ?? DEFAULT_PARAMS.thickness), 0, 1),
      iridescence: clamp(Number(params?.iridescence ?? DEFAULT_PARAMS.iridescence), 0, 1),
      fresnel: clamp(Number(params?.fresnel ?? DEFAULT_PARAMS.fresnel), 0, 1),
      distortion: clamp(Number(params?.distortion ?? DEFAULT_PARAMS.distortion), 0, 1),
      drift: clamp(Number(params?.drift ?? DEFAULT_PARAMS.drift), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures, resolution }) {
    const [r, g, b] = hexToRgb(params.baseTint);
    const sourceImage = textures.sourceImage;

    setUniformVec3(gl, locations.uBaseTint, r, g, b);
    setUniformFloat(gl, locations.uThickness, params.thickness);
    setUniformFloat(gl, locations.uIridescence, params.iridescence);
    setUniformFloat(gl, locations.uFresnel, params.fresnel);
    setUniformFloat(gl, locations.uDistortion, params.distortion);
    setUniformFloat(gl, locations.uDrift, params.drift);
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
uniform float uThickness;
uniform float uIridescence;
uniform float uFresnel;
uniform float uDistortion;
uniform float uDrift;
uniform float uOpacity;
uniform int uHasSourceImage;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

vec3 thinFilmColor(float phase) {
  return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.1, 4.2));
}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  centered.x *= uResolution.x / max(uResolution.y, 0.0001);
  float drift = uTime * mix(0.0, 0.18, uDrift);
  vec2 fieldUv = centered * mix(1.8, 4.6, uDistortion) + vec2(uSeed * 3.7, -uSeed * 2.9);
  float fieldA = fbm(fieldUv * 2.6 + vec2(drift, -drift * 0.7));
  float fieldB = fbm((fieldUv.yx + 0.35) * 2.1 - vec2(drift * 0.6, drift));
  vec2 grad = vec2(fieldA - 0.5, fieldB - 0.5) * mix(0.0, 0.85, uDistortion);
  vec3 normal = normalize(vec3(grad, 1.0));
  float ndotv = saturate(normal.z);
  float fresnel = pow(1.0 - ndotv, mix(2.8, 0.8, uFresnel));
  float ripple = fbm(fieldUv * 5.2 - grad * 1.8 + drift * 0.45);
  float thickness = mix(120.0, 520.0, uThickness);
  thickness += (ripple - 0.5) * mix(0.0, 220.0, uDistortion);
  float phase = thickness * (0.016 + uIridescence * 0.02) / max(ndotv, 0.22);
  vec3 film = thinFilmColor(phase);

  vec3 underlay = mix(vec3(0.97, 0.98, 1.0), uBaseTint, 0.22 + ripple * 0.16);

  if (uHasSourceImage == 1) {
    vec2 imageUv = coverUv(uv + grad * mix(0.0, 0.015, uDistortion), uImageResolution, uResolution);
    underlay = sampleClamped(uSourceImage, imageUv).rgb;
  }

  vec3 base = mix(underlay, uBaseTint, 0.22);
  vec3 interference = mix(base, film, 0.22 + uIridescence * 0.62);
  interference += fresnel * mix(0.02, 0.26, uFresnel) * film;
  interference += (ripple - 0.5) * 0.05;

  float radial = length(centered) * 1.45;
  float body = 1.0 - smoothstep(0.72, 1.38, radial);
  vec3 color = mix(base, interference, 0.58 + fresnel * 0.26);
  color *= 0.92 + body * 0.08;
  float alpha = uOpacity * clamp(0.34 + body * 0.26 + fresnel * 0.32, 0.0, 1.0);

  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
};
