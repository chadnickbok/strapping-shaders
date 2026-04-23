import type { EffectDefinition } from "../types";
import { clamp } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2 } from "../runtime/webgl";
import { GLSL_COMMON, GLSL_IMAGE_UTILS, REQUIRED_IMAGE_ASSET_SLOT } from "./sharedShaderUtils";

export type CinematicBokehParams = {
  focus: number;
  focusSpread: number;
  aperture: number;
  highlightBoost: number;
  anamorphic: number;
  bladeCount: number;
  bloom: number;
};

const DEFAULT_PARAMS: CinematicBokehParams = {
  focus: 0.5,
  focusSpread: 0.22,
  aperture: 0.36,
  highlightBoost: 0.56,
  anamorphic: 0.18,
  bladeCount: 6,
  bloom: 0.26
};

export const cinematicBokehDefinition: EffectDefinition<CinematicBokehParams> = {
  effectId: "cinematic-bokeh",
  displayName: "Cinematic Bokeh",
  summary: "Image-backed photographic blur with highlight-weighted bokeh discs and a soft focus band.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "focus",
      label: "Focus",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Vertical position of the in-focus band."
    },
    {
      kind: "range",
      name: "focusSpread",
      label: "Focus Spread",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Width of the in-focus region before blur ramps in."
    },
    {
      kind: "range",
      name: "aperture",
      label: "Aperture",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall blur radius and depth-of-field strength."
    },
    {
      kind: "range",
      name: "highlightBoost",
      label: "Highlight Boost",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly bright pixels bloom into the blur kernel."
    },
    {
      kind: "range",
      name: "anamorphic",
      label: "Anamorphic",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Horizontal stretch applied to the bokeh kernel."
    },
    {
      kind: "range",
      name: "bladeCount",
      label: "Blade Count",
      min: 3,
      max: 8,
      step: 1,
      description: "Polygonal aperture blade count for the bokeh shape."
    },
    {
      kind: "range",
      name: "bloom",
      label: "Bloom",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Extra glow added after the blur pass."
    }
  ],
  uniformNames: [
    "uFocus",
    "uFocusSpread",
    "uAperture",
    "uHighlightBoost",
    "uAnamorphic",
    "uBladeCount",
    "uBloom",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      focus: clamp(Number(params?.focus ?? DEFAULT_PARAMS.focus), 0, 1),
      focusSpread: clamp(Number(params?.focusSpread ?? DEFAULT_PARAMS.focusSpread), 0.02, 1),
      aperture: clamp(Number(params?.aperture ?? DEFAULT_PARAMS.aperture), 0, 1),
      highlightBoost: clamp(Number(params?.highlightBoost ?? DEFAULT_PARAMS.highlightBoost), 0, 1),
      anamorphic: clamp(Number(params?.anamorphic ?? DEFAULT_PARAMS.anamorphic), 0, 1),
      bladeCount: Math.round(clamp(Number(params?.bladeCount ?? DEFAULT_PARAMS.bladeCount), 3, 8)),
      bloom: clamp(Number(params?.bloom ?? DEFAULT_PARAMS.bloom), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    setUniformFloat(gl, locations.uFocus, params.focus);
    setUniformFloat(gl, locations.uFocusSpread, params.focusSpread);
    setUniformFloat(gl, locations.uAperture, params.aperture);
    setUniformFloat(gl, locations.uHighlightBoost, params.highlightBoost);
    setUniformFloat(gl, locations.uAnamorphic, params.anamorphic);
    setUniformFloat(gl, locations.uBladeCount, params.bladeCount);
    setUniformFloat(gl, locations.uBloom, params.bloom);
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
uniform float uFocus;
uniform float uFocusSpread;
uniform float uAperture;
uniform float uHighlightBoost;
uniform float uAnamorphic;
uniform float uBladeCount;
uniform float uBloom;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

float polygonRadius(float angle, float sides) {
  float segment = 2.0 * PI / max(sides, 3.0);
  float local = mod(angle + segment * 0.5, segment) - segment * 0.5;
  return cos(PI / max(sides, 3.0)) / max(cos(local), 0.0001);
}

void main() {
  vec2 uv = vUv;
  vec2 imageUv = coverUv(uv, uImageResolution, uResolution);
  vec4 source = sampleClamped(uSourceImage, imageUv);
  float focusError = abs(uv.y - uFocus);
  float radial = length((uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 0.0001), 1.0));
  float tonalBias = (0.62 - luma(source.rgb)) * 0.18;
  float cocMask = smoothstep(uFocusSpread * 0.35, uFocusSpread + 0.04, focusError + radial * 0.1 + tonalBias);
  float blurRadiusPx = mix(0.0, 18.0, uAperture) * cocMask;

  if (blurRadiusPx < 0.35) {
    outColor = source;
    return;
  }

  vec2 texel = 1.0 / max(uImageResolution, vec2(1.0));
  vec3 accum = source.rgb * 0.24;
  float totalWeight = 0.24;
  float seedJitter = uSeed * 91.37;

  for (int index = 0; index < 12; index += 1) {
    float t = float(index) / 12.0;
    float angle = t * 2.0 * PI + seedJitter;
    float ring = index < 6 ? 0.55 : 1.0;
    vec2 local = vec2(cos(angle), sin(angle));
    local.x *= 1.0 + uAnamorphic * 1.7;
    local.y *= mix(1.0, 0.82, uAnamorphic);
    float polygonScale = polygonRadius(angle, uBladeCount);
    vec2 offset = local * polygonScale * ring * blurRadiusPx * texel;
    vec2 sampleUv = clamp(imageUv + offset, 0.001, 0.999);
    vec3 sampleColor = texture(uSourceImage, sampleUv).rgb;
    float highlight = smoothstep(0.58, 1.0, luma(sampleColor));
    float weight = mix(0.7, 1.0, ring) * (1.0 + highlight * mix(0.0, 2.2, uHighlightBoost));
    accum += sampleColor * weight;
    totalWeight += weight;
  }

  vec3 blurred = accum / max(totalWeight, 0.0001);
  float glow = smoothstep(0.62, 1.02, luma(blurred));
  vec3 color = mix(source.rgb, blurred, cocMask);
  color += glow * mix(0.0, 0.22, uBloom);
  float vignette = 1.0 - smoothstep(0.65, 1.28, radial);
  color *= 0.88 + vignette * 0.18;

  outColor = vec4(clamp(color, 0.0, 1.0), source.a);
}
`
};
