import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON, GLSL_IMAGE_UTILS, REQUIRED_IMAGE_ASSET_SLOT } from "./sharedShaderUtils";

export type FrostedAcrylicParams = {
  blur: number;
  distortion: number;
  refraction: number;
  thickness: number;
  edgeGlow: number;
  tint: string;
  opacity: number;
};

const DEFAULT_PARAMS: FrostedAcrylicParams = {
  blur: 0.46,
  distortion: 0.18,
  refraction: 0.26,
  thickness: 0.44,
  edgeGlow: 0.48,
  tint: "#e8f2ff",
  opacity: 0.92
};

export const frostedAcrylicDefinition: EffectDefinition<FrostedAcrylicParams> = {
  effectId: "frosted-acrylic",
  displayName: "Frosted Acrylic",
  summary: "Soft industrial glass with blurred transmission, restrained refraction, tint, and edge thickness.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "blur",
      label: "Blur",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Transmission blur driven by the acrylic roughness."
    },
    {
      kind: "range",
      name: "distortion",
      label: "Distortion",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Subtle surface waviness used for the transmission normals."
    },
    {
      kind: "range",
      name: "refraction",
      label: "Refraction",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly the background bends through the pane."
    },
    {
      kind: "range",
      name: "thickness",
      label: "Thickness",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Amount of edge build-up and bevel read."
    },
    {
      kind: "range",
      name: "edgeGlow",
      label: "Edge Glow",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Bright edge highlight and acrylic catch light."
    },
    {
      kind: "color",
      name: "tint",
      label: "Tint",
      description: "Subtle body tint for the acrylic volume."
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
    "uBlur",
    "uDistortion",
    "uRefraction",
    "uThickness",
    "uEdgeGlow",
    "uTint",
    "uOpacity",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      blur: clamp(Number(params?.blur ?? DEFAULT_PARAMS.blur), 0, 1),
      distortion: clamp(Number(params?.distortion ?? DEFAULT_PARAMS.distortion), 0, 1),
      refraction: clamp(Number(params?.refraction ?? DEFAULT_PARAMS.refraction), 0, 1),
      thickness: clamp(Number(params?.thickness ?? DEFAULT_PARAMS.thickness), 0, 1),
      edgeGlow: clamp(Number(params?.edgeGlow ?? DEFAULT_PARAMS.edgeGlow), 0, 1),
      tint: sanitizeCssColor(params?.tint, DEFAULT_PARAMS.tint),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    const [r, g, b] = hexToRgb(params.tint);

    setUniformFloat(gl, locations.uBlur, params.blur);
    setUniformFloat(gl, locations.uDistortion, params.distortion);
    setUniformFloat(gl, locations.uRefraction, params.refraction);
    setUniformFloat(gl, locations.uThickness, params.thickness);
    setUniformFloat(gl, locations.uEdgeGlow, params.edgeGlow);
    setUniformVec3(gl, locations.uTint, r, g, b);
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
uniform float uBlur;
uniform float uDistortion;
uniform float uRefraction;
uniform float uThickness;
uniform float uEdgeGlow;
uniform vec3 uTint;
uniform float uOpacity;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

vec4 sampleFrosted(vec2 uv, vec2 direction, float blurAmount) {
  vec2 texel = 1.0 / max(uImageResolution, vec2(1.0));
  float radius = mix(0.0, 12.0, blurAmount);
  vec2 major = direction * texel * radius;
  vec2 minor = vec2(-direction.y, direction.x) * texel * radius * 0.74;
  vec4 color = texture(uSourceImage, uv) * 0.26;
  color += texture(uSourceImage, clamp(uv + major, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv - major, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv + minor, 0.001, 0.999)) * 0.16;
  color += texture(uSourceImage, clamp(uv - minor, 0.001, 0.999)) * 0.16;
  color += texture(uSourceImage, clamp(uv + (major + minor) * 0.55, 0.001, 0.999)) * 0.03;
  color += texture(uSourceImage, clamp(uv - (major + minor) * 0.55, 0.001, 0.999)) * 0.03;
  return color;
}

void main() {
  vec2 uv = vUv;
  float fieldScale = mix(9.0, 18.0, uDistortion);
  float drift = uTime * 0.03;
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318)) * 2.6;
  float fieldA = fbm(uv * fieldScale + seedOffset + vec2(drift, -drift * 0.6));
  float fieldB = fbm((uv.yx + 0.35) * (fieldScale * 1.17) - seedOffset + vec2(-drift * 0.4, drift));
  vec2 normalXY = vec2(fieldA - 0.5, fieldB - 0.5) * mix(0.0, 0.08, uDistortion);
  vec2 direction = normalize(normalXY + vec2(0.0001, 0.0001));
  float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float bevelWidth = mix(0.06, 0.22, uThickness);
  float edge = 1.0 - smoothstep(0.0, bevelWidth, edgeDistance);
  vec2 warpedUv = coverUv(uv + normalXY * mix(0.0, 0.05, uRefraction) + direction * edge * 0.01, uImageResolution, uResolution);
  vec2 sampleUv = clamp(warpedUv, 0.001, 0.999);
  vec4 base = sampleFrosted(sampleUv, direction, uBlur);
  float chromaOffset = mix(0.0, 0.0022, uRefraction);
  float red = texture(uSourceImage, clamp(sampleUv + direction * chromaOffset, 0.001, 0.999)).r;
  float blue = texture(uSourceImage, clamp(sampleUv - direction * chromaOffset, 0.001, 0.999)).b;

  vec3 color = base.rgb;
  color.r = mix(color.r, red, uRefraction * 0.3);
  color.b = mix(color.b, blue, uRefraction * 0.26);
  color = mix(color, uTint, 0.12 + uThickness * 0.14);

  float fresnel = pow(1.0 - edgeDistance * 1.8, 1.5);
  float edgeHighlight = smoothstep(0.18, 1.0, fresnel) * mix(0.0, 0.34, uEdgeGlow);
  float innerGlow = smoothstep(0.42, 0.95, fbm(uv * 4.5 + normalXY * 15.0)) * uEdgeGlow * 0.08;
  color += edgeHighlight * mix(uTint, vec3(1.0), 0.7);
  color += innerGlow;
  color *= 0.95 + edge * (0.04 + uThickness * 0.08);

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
