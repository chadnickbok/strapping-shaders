import type { EffectDefinition } from "../types";
import { clamp } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2 } from "../runtime/webgl";

export type LiquidDistortionParams = {
  distortion: number;
  refraction: number;
  blur: number;
  motion: number;
  featureSize: number;
  edgeStability: number;
  highlight: number;
};

const DEFAULT_PARAMS: LiquidDistortionParams = {
  distortion: 0.3,
  refraction: 0.35,
  blur: 0.08,
  motion: 0.38,
  featureSize: 0.5,
  edgeStability: 0.1,
  highlight: 0.35
};

export const liquidDistortionDefinition: EffectDefinition<LiquidDistortionParams> = {
  effectId: "liquid-distortion",
  displayName: "Liquid Distortion",
  summary: "Image-backed liquid refraction with blur, motion, and interior glint.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [
    {
      name: "sourceImage",
      label: "Source image",
      required: true,
      accept: "image"
    }
  ],
  alphaMode: "transparent",
  controls: [
    {
      kind: "range",
      name: "distortion",
      label: "Distortion",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "refraction",
      label: "Refraction",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "blur",
      label: "Blur",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "motion",
      label: "Motion",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "featureSize",
      label: "Feature Size",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "edgeStability",
      label: "Edge Stability",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "highlight",
      label: "Highlight",
      min: 0,
      max: 1,
      step: 0.01
    }
  ],
  uniformNames: [
    "uDistortion",
    "uRefraction",
    "uBlur",
    "uMotion",
    "uFeatureSize",
    "uEdgeStability",
    "uHighlight",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      distortion: clamp(Number(params?.distortion ?? DEFAULT_PARAMS.distortion), 0, 1),
      refraction: clamp(Number(params?.refraction ?? DEFAULT_PARAMS.refraction), 0, 1),
      blur: clamp(Number(params?.blur ?? DEFAULT_PARAMS.blur), 0, 1),
      motion: clamp(Number(params?.motion ?? DEFAULT_PARAMS.motion), 0, 1),
      featureSize: clamp(Number(params?.featureSize ?? DEFAULT_PARAMS.featureSize), 0, 1),
      edgeStability: clamp(Number(params?.edgeStability ?? DEFAULT_PARAMS.edgeStability), 0, 1),
      highlight: clamp(Number(params?.highlight ?? DEFAULT_PARAMS.highlight), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    setUniformFloat(gl, locations.uDistortion, params.distortion);
    setUniformFloat(gl, locations.uRefraction, params.refraction);
    setUniformFloat(gl, locations.uBlur, params.blur);
    setUniformFloat(gl, locations.uMotion, params.motion);
    setUniformFloat(gl, locations.uFeatureSize, params.featureSize);
    setUniformFloat(gl, locations.uEdgeStability, params.edgeStability);
    setUniformFloat(gl, locations.uHighlight, params.highlight);
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
uniform float uDistortion;
uniform float uRefraction;
uniform float uBlur;
uniform float uMotion;
uniform float uFeatureSize;
uniform float uEdgeStability;
uniform float uHighlight;
uniform sampler2D uSourceImage;

float hash21(vec2 p) {
  p = fract(p * vec2(451.73, 231.91));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 smoothLocal = local * local * (3.0 - 2.0 * local);
  float a = hash21(cell);
  float b = hash21(cell + vec2(1.0, 0.0));
  float c = hash21(cell + vec2(0.0, 1.0));
  float d = hash21(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, smoothLocal.x), mix(c, d, smoothLocal.x), smoothLocal.y);
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;

  for (int octave = 0; octave < 5; octave += 1) {
    total += amplitude * noise(p);
    p = p * 2.1 + vec2(9.2, 5.4);
    amplitude *= 0.52;
  }

  return total;
}

vec2 coverUv(vec2 uv, vec2 imageSize, vec2 frameSize) {
  float imageAspect = imageSize.x / max(imageSize.y, 0.0001);
  float frameAspect = frameSize.x / max(frameSize.y, 0.0001);
  vec2 scale = vec2(1.0);
  vec2 offset = vec2(0.0);

  if (imageAspect > frameAspect) {
    scale.x = frameAspect / imageAspect;
    offset.x = (1.0 - scale.x) * 0.5;
  } else {
    scale.y = imageAspect / frameAspect;
    offset.y = (1.0 - scale.y) * 0.5;
  }

  return offset + uv * scale;
}

vec4 sampleSoft(vec2 uv, vec2 direction, float blurAmount) {
  vec2 pixel = 1.0 / max(uImageResolution, vec2(1.0));
  float radius = mix(0.0, 10.0, blurAmount);
  vec2 spread = direction * pixel * radius;
  vec2 cross = vec2(-direction.y, direction.x) * pixel * radius * 0.65;
  vec4 color = texture(uSourceImage, uv) * 0.42;
  color += texture(uSourceImage, clamp(uv + spread, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv - spread, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv + cross, 0.001, 0.999)) * 0.11;
  color += texture(uSourceImage, clamp(uv - cross, 0.001, 0.999)) * 0.11;
  return color;
}

void main() {
  vec2 uv = vUv;
  float detailScale = mix(7.5, 1.65, uFeatureSize);
  float motionSpeed = mix(0.0, 0.35, uMotion);
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318)) * 3.15;
  float drift = uTime * motionSpeed;
  float noiseA = fbm(uv * detailScale + seedOffset + vec2(0.0, drift));
  float noiseB = fbm((uv.yx + 0.35) * (detailScale * 1.18) - seedOffset + vec2(drift * 0.8, -drift * 0.55));
  vec2 distortionField = vec2(noiseA - 0.5, noiseB - 0.5);
  float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float edgeMask = smoothstep(0.0, mix(0.02, 0.24, uEdgeStability), edgeDistance);
  float intensity = mix(0.0, 0.065, uDistortion) * edgeMask;
  float refraction = mix(0.0, 0.03, uRefraction) * edgeMask;
  vec2 direction = normalize(distortionField + vec2(0.0001, 0.0001));
  vec2 warpedFrameUv = uv + distortionField * intensity + direction * refraction;
  vec2 sampledUv = clamp(coverUv(warpedFrameUv, uImageResolution, uResolution), 0.001, 0.999);
  vec4 base = sampleSoft(sampledUv, direction, uBlur);
  float chromaOffset = mix(0.0, 0.0025, uRefraction);
  float red = texture(uSourceImage, clamp(sampledUv + direction * chromaOffset, 0.001, 0.999)).r;
  float blue = texture(uSourceImage, clamp(sampledUv - direction * chromaOffset, 0.001, 0.999)).b;
  vec3 color = base.rgb;
  color.r = mix(color.r, red, uRefraction * 0.35);
  color.b = mix(color.b, blue, uRefraction * 0.3);
  float specular = smoothstep(0.22, 0.96, fbm(uv * detailScale * 0.75 - direction * 2.0 + drift * 1.5));
  float highlight = specular * mix(0.0, 0.18, uHighlight) * edgeMask;
  color += highlight;
  outColor = vec4(clamp(color, 0.0, 1.0), base.a);
}
`
};
