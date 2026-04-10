import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";

export type CausticPoolParams = {
  waterTint: string;
  lightTint: string;
  layerMix: number;
  distortion: number;
  waves: number;
  caustic: number;
  size: number;
  openness: number;
  speed: number;
  depth: number;
  halo: number;
};

const DEFAULT_PARAMS: CausticPoolParams = {
  waterTint: "#97d7e6",
  lightTint: "#fffdf7",
  layerMix: 0.72,
  distortion: 0.58,
  waves: 0.58,
  caustic: 0.76,
  size: 0.42,
  openness: 0.18,
  speed: 0.32,
  depth: 0.52,
  halo: 0.18
};

export const causticPoolDefinition: EffectDefinition<CausticPoolParams> = {
  effectId: "caustic-pool",
  displayName: "Caustic Pool",
  summary: "Image-first swimming-pool floor treatment with smooth water refraction and clean caustic light.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [
    {
      name: "sourceImage",
      label: "Pool floor image",
      required: false,
      accept: "image"
    }
  ],
  alphaMode: "opaque",
  controls: [
    {
      kind: "color",
      name: "waterTint",
      label: "Water Tint",
      description: "Transmission tint carried through the water body."
    },
    {
      kind: "color",
      name: "lightTint",
      label: "Highlight Tint",
      description: "Tint for the brightest caustic ridges."
    },
    {
      kind: "range",
      name: "layerMix",
      label: "Layer Mix",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Overall strength of the submerged-water treatment and caustic overlay."
    },
    {
      kind: "range",
      name: "distortion",
      label: "Distortion",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Strength of the floor-image warp and local lensing without increasing caustic turbulence."
    },
    {
      kind: "range",
      name: "waves",
      label: "Waves",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Energy in the shared macro water field."
    },
    {
      kind: "range",
      name: "caustic",
      label: "Caustic",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Brightness of the caustic lattice layer."
    },
    {
      kind: "range",
      name: "size",
      label: "Size",
      min: 0,
      max: 3,
      step: 0.01,
      description: "Caustic zoom. Values above 1 continue pushing into larger zoomed caustics."
    },
    {
      kind: "range",
      name: "openness",
      label: "Openness",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Opens larger dark gaps and reduces stacked secondary caustic fill."
    },
    {
      kind: "range",
      name: "speed",
      label: "Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Shared motion rate for the water body and caustics."
    },
    {
      kind: "range",
      name: "depth",
      label: "Depth",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls water depth feel, tinting, blur, and displacement scale."
    },
    {
      kind: "range",
      name: "halo",
      label: "Halo",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Soft lift around the brightest caustic lines."
    }
  ],
  uniformNames: [
    "uWaterTint",
    "uLightTint",
    "uLayerMix",
    "uDistortion",
    "uWaves",
    "uCaustic",
    "uSize",
    "uOpenness",
    "uSpeed",
    "uDepth",
    "uHalo",
    "uHasSourceImage",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      waterTint: sanitizeHexColor(params?.waterTint, DEFAULT_PARAMS.waterTint),
      lightTint: sanitizeHexColor(params?.lightTint, DEFAULT_PARAMS.lightTint),
      layerMix: clamp(Number(params?.layerMix ?? DEFAULT_PARAMS.layerMix), 0, 1),
      distortion: clamp(Number(params?.distortion ?? DEFAULT_PARAMS.distortion), 0, 1),
      waves: clamp(Number(params?.waves ?? DEFAULT_PARAMS.waves), 0, 1),
      caustic: clamp(Number(params?.caustic ?? DEFAULT_PARAMS.caustic), 0, 1),
      size: clamp(Number(params?.size ?? DEFAULT_PARAMS.size), 0, 3),
      openness: clamp(Number(params?.openness ?? DEFAULT_PARAMS.openness), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      depth: clamp(Number(params?.depth ?? DEFAULT_PARAMS.depth), 0, 1),
      halo: clamp(Number(params?.halo ?? DEFAULT_PARAMS.halo), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, resolution, textures }) {
    const [waterR, waterG, waterB] = hexToRgb(params.waterTint);
    const [lightR, lightG, lightB] = hexToRgb(params.lightTint);
    const sourceImage = textures.sourceImage;

    setUniformVec3(gl, locations.uWaterTint, waterR, waterG, waterB);
    setUniformVec3(gl, locations.uLightTint, lightR, lightG, lightB);
    setUniformFloat(gl, locations.uLayerMix, params.layerMix);
    setUniformFloat(gl, locations.uDistortion, params.distortion);
    setUniformFloat(gl, locations.uWaves, params.waves);
    setUniformFloat(gl, locations.uCaustic, params.caustic);
    setUniformFloat(gl, locations.uSize, params.size);
    setUniformFloat(gl, locations.uOpenness, params.openness);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformFloat(gl, locations.uDepth, params.depth);
    setUniformFloat(gl, locations.uHalo, params.halo);
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
uniform vec3 uWaterTint;
uniform vec3 uLightTint;
uniform float uLayerMix;
uniform float uDistortion;
uniform float uWaves;
uniform float uCaustic;
uniform float uSize;
uniform float uOpenness;
uniform float uSpeed;
uniform float uDepth;
uniform float uHalo;
uniform int uHasSourceImage;
uniform sampler2D uSourceImage;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash22(vec2 p) {
  return vec2(
    fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123),
    fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123)
  );
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
    p = p * 2.02 + vec2(8.1, 5.3);
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

vec2 waterField(vec2 p, float timeValue) {
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318)) * 2.7;
  float macroScale = mix(0.9, 1.85, uWaves);
  vec2 baseUv = p * macroScale + seedOffset;
  float lowA = fbm(baseUv + vec2(0.0, timeValue * 0.18));
  float lowB = fbm(baseUv.yx * 1.08 + vec2(4.2, -3.4) + vec2(-timeValue * 0.12, timeValue * 0.15));
  float midA = fbm(baseUv * 1.72 + vec2(8.3, 1.6) + vec2(timeValue * 0.09, -timeValue * 0.07));
  float midB = fbm(baseUv.yx * 1.56 + vec2(-2.4, 6.9) - vec2(timeValue * 0.06, timeValue * 0.1));
  vec2 low = vec2(lowA - 0.5, lowB - 0.5);
  vec2 mid = vec2(midA - 0.5, midB - 0.5);
  return low * 0.72 + mid * mix(0.14, 0.48, uWaves);
}

vec2 lensField(vec2 p, float timeValue) {
  vec2 seedOffset = vec2(-sin(uSeed * 6.28318), cos(uSeed * 6.28318)) * 4.1;
  float lensScale = mix(2.1, 4.7, uWaves);
  vec2 lensUv = p * lensScale + seedOffset;
  float lensA = fbm(lensUv + vec2(timeValue * 0.2, -timeValue * 0.16));
  float lensB = fbm(lensUv.yx * 1.12 + vec2(-6.4, 2.7) - vec2(timeValue * 0.17, timeValue * 0.11));
  float lensC = fbm(lensUv * 2.06 + vec2(3.6, -5.2) + vec2(timeValue * 0.12, timeValue * 0.08));
  float lensD = fbm(lensUv.yx * 1.88 + vec2(7.1, 1.2) - vec2(timeValue * 0.09, -timeValue * 0.13));
  vec2 broad = vec2(lensA - 0.5, lensB - 0.5);
  vec2 pocket = vec2(lensC - 0.5, lensD - 0.5);
  return broad * 0.76 + pocket * mix(0.1, 0.36, uDistortion);
}

vec4 sampleSoft(vec2 uv, vec2 direction, float blurAmount) {
  vec2 pixel = 1.0 / max(uImageResolution, vec2(1.0));
  float radius = mix(0.0, 14.0, blurAmount);
  vec2 spread = direction * pixel * radius;
  vec2 cross = vec2(-direction.y, direction.x) * pixel * radius * 0.68;
  vec4 color = texture(uSourceImage, uv) * 0.46;
  color += texture(uSourceImage, clamp(uv + spread, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv - spread, 0.001, 0.999)) * 0.18;
  color += texture(uSourceImage, clamp(uv + cross, 0.001, 0.999)) * 0.09;
  color += texture(uSourceImage, clamp(uv - cross, 0.001, 0.999)) * 0.09;
  return color;
}

vec2 worley(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float nearest = 8.0;
  float secondNearest = 8.0;

  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = hash22(cell + offset + uSeed * 31.7);
      vec2 diff = offset + point - local;
      float distanceSquared = dot(diff, diff);

      if (distanceSquared < nearest) {
        secondNearest = nearest;
        nearest = distanceSquared;
      } else if (distanceSquared < secondNearest) {
        secondNearest = distanceSquared;
      }
    }
  }

  return sqrt(max(vec2(nearest, secondNearest), vec2(0.0)));
}

float causticBand(vec2 field, float width, float sharpness) {
  float edge = max(field.y - field.x, 0.0);
  float band = 1.0 - smoothstep(0.0, width, edge);
  return pow(saturate(band), sharpness);
}

float causticHalo(vec2 field, float width) {
  float edge = max(field.y - field.x, 0.0);
  float band = 1.0 - smoothstep(0.01, width, edge);
  return band * band;
}

vec3 fallbackFloor(vec2 centered) {
  float vertical = smoothstep(-0.86, 0.48, centered.y);
  vec3 plasterLow = vec3(0.84, 0.88, 0.92);
  vec3 plasterHigh = vec3(0.96, 0.975, 0.985);
  vec3 base = mix(plasterLow, plasterHigh, vertical);
  vec3 waterCast = uWaterTint * 0.18 + vec3(0.82, 0.84, 0.87);
  return mix(base, base * waterCast, 0.14 + uDepth * 0.16);
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 centered = (vUv - 0.5) * aspect;
  float timeValue = uTime * mix(0.0, 0.34, uSpeed);

  vec2 macroWater = waterField(centered * 1.12, timeValue);
  vec2 lensWater = lensField(centered * (1.14 + uDepth * 0.32) + macroWater * 0.18, timeValue * 1.12);
  vec2 waterVector = macroWater + lensWater * mix(0.18, 0.72, uDistortion);
  vec2 direction = normalize(waterVector + vec2(0.0001, 0.0001));
  vec2 tangent = vec2(-direction.y, direction.x);
  float displacementStrength = mix(0.01, 0.082, uDistortion) * mix(0.82, 1.52, uWaves);
  float refractionStrength = mix(0.004, 0.036, uDepth) * mix(0.28, 1.0, uDistortion);
  float lensStrength = mix(0.0, 0.052, uDistortion) * mix(0.24, 1.0, uDepth);
  vec2 floorOffset = (
    waterVector * displacementStrength +
    direction * refractionStrength +
    tangent * dot(lensWater, vec2(0.82, -0.64)) * lensStrength * 0.45
  ) / aspect;
  vec2 flowDx = dFdx(waterVector);
  vec2 flowDy = dFdy(waterVector);
  float flowCompression =
    (length(flowDx) + length(flowDy)) * mix(180.0, 360.0, uWaves) +
    length(lensWater) * mix(0.45, 1.2, uDistortion);
  float convergence = smoothstep(0.18, 1.18, flowCompression);
  vec2 causticVector = macroWater;
  vec2 causticDirection = normalize(causticVector + vec2(0.0001, 0.0001));
  vec2 causticDx = dFdx(causticVector);
  vec2 causticDy = dFdy(causticVector);
  float causticCompression = (length(causticDx) + length(causticDy)) * mix(180.0, 360.0, uWaves);

  vec3 baseColor = fallbackFloor(centered);
  vec3 originalFloor = baseColor;

  if (uHasSourceImage == 1) {
    vec2 floorUv = clamp(vUv + floorOffset, 0.001, 0.999);
    vec2 sampledUv = clamp(coverUv(floorUv, uImageResolution, uResolution), 0.001, 0.999);
    vec3 direct = texture(uSourceImage, sampledUv).rgb;
    float blurAmount = (0.12 + uDepth * 0.24 + uWaves * 0.16) * mix(0.22, 1.0, uDistortion);
    float lensAmount = convergence * mix(0.0, 0.018, uDistortion) * (0.6 + uDepth * 0.8);
    vec2 lensOffset = (direction * (0.003 + lensAmount * 0.65) + tangent * lensWater.x * lensAmount * 0.42) / aspect;
    vec2 pinchOffset = (tangent * lensAmount * 0.45 - direction * dot(lensWater, vec2(0.7, -0.5)) * 0.004) / aspect;
    vec3 softened = sampleSoft(sampledUv, direction, blurAmount).rgb;
    vec3 lensRefine =
      texture(uSourceImage, clamp(sampledUv + lensOffset * 0.92, 0.001, 0.999)).rgb * 0.56 +
      texture(uSourceImage, clamp(sampledUv - pinchOffset * 0.76, 0.001, 0.999)).rgb * 0.44;
    float softenMix = (0.26 + uDepth * 0.28 + uWaves * 0.12) * mix(0.32, 1.0, uDistortion);
    vec3 submerged = mix(direct, softened, softenMix);
    submerged = mix(submerged, lensRefine, 0.26 + convergence * 0.18 + uDistortion * 0.08);
    vec3 waterCast = uWaterTint * 0.78 + vec3(0.22, 0.26, 0.31);
    submerged = mix(submerged, submerged * waterCast, (0.18 + uDepth * 0.26) * mix(0.4, 1.0, uLayerMix));
    float luma = dot(submerged, vec3(0.2126, 0.7152, 0.0722));
    submerged = mix(vec3(luma) * (uWaterTint * 0.25 + vec3(0.75, 0.78, 0.82)), submerged, 0.84 - uDepth * 0.08);
    submerged *= 0.97 + convergence * 0.08;
    originalFloor = direct;
    baseColor = mix(direct, submerged, mix(0.24, 0.94, uLayerMix));
  } else {
    float waterShade = 0.98 + waterVector.x * 0.09 + waterVector.y * 0.07 + convergence * 0.05;
    baseColor *= waterShade;
  }

  float sizeBase = min(uSize, 1.0);
  float sizeOver = clamp((uSize - 1.0) / 2.0, 0.0, 1.0);
  float causticDensity = mix(8.9, 3.5, sizeBase);
  causticDensity = mix(causticDensity, 0.72, sizeOver);
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318));
  vec2 causticDomain = centered * causticDensity + seedOffset * 4.8;
  causticDomain += causticVector * mix(1.4, 2.8, uWaves) + causticDirection * mix(0.24, 0.74, uWaves);
  causticDomain += vec2(timeValue * 0.58, -timeValue * 0.34);
  vec2 causticWarp = waterField(centered * 1.56 + causticVector * 0.32 + vec2(0.38, -0.24), timeValue * 1.08);

  vec2 fieldA = worley(causticDomain + causticWarp * 1.12);
  vec2 fieldB = worley(causticDomain * 1.08 - causticWarp.yx * 0.86 + vec2(5.6, -3.4));

  float ridgeWidth = mix(0.038, 0.09, sizeBase);
  ridgeWidth = mix(ridgeWidth, 0.082, sizeOver);
  ridgeWidth *= mix(1.0, 0.62, uOpenness);
  float secondaryWidth = ridgeWidth * mix(0.78, 0.38, uOpenness);
  float sharpness = mix(2.0, 3.6, uCaustic) * mix(1.0, 1.12, uOpenness);
  float webA = causticBand(fieldA, ridgeWidth, sharpness);
  float webB = causticBand(fieldB, secondaryWidth, sharpness * mix(0.92, 1.06, uOpenness));
  float haloA = causticHalo(fieldA, mix(0.085, 0.22, uHalo) * mix(1.0, 0.78, uOpenness));
  float haloB = causticHalo(fieldB, mix(0.075, 0.2, uHalo) * mix(0.92, 0.58, uOpenness));
  float junctionA = pow(saturate(1.0 - fieldA.x * mix(2.08, 2.45, uOpenness)), 4.4) * webA;
  float junctionB = pow(saturate(1.0 - fieldB.x * mix(2.2, 2.65, uOpenness)), 4.2) * webB;
  float focusMask = 0.86 + 0.42 * smoothstep(0.12, 0.74, causticCompression * mix(0.35, 1.15, uWaves));
  float secondaryWeight = mix(0.34, 0.06, uOpenness) * mix(1.0, 0.82, sizeOver);
  float primaryJunctionWeight = mix(0.26, 0.18, uOpenness);
  float secondaryJunctionWeight = mix(0.14, 0.02, uOpenness) * mix(1.0, 0.78, sizeOver);
  float primaryHaloWeight = mix(0.74, 0.44, uOpenness);
  float secondaryHaloWeight = mix(0.22, 0.03, uOpenness) * mix(1.0, 0.7, sizeOver);
  float causticCore =
    (webA * 0.9 + webB * secondaryWeight + junctionA * primaryJunctionWeight + junctionB * secondaryJunctionWeight) *
    focusMask;
  float haloLift = (haloA * primaryHaloWeight + haloB * secondaryHaloWeight) * focusMask;

  vec3 color = baseColor;
  vec3 causticTint = mix(uLightTint, vec3(1.0), 0.3);
  float causticStrength = mix(0.16, 1.12, uCaustic) * mix(0.18, 1.0, uLayerMix);
  color += causticTint * causticCore * causticStrength;
  color += mix(causticTint, vec3(1.0), 0.54) * haloLift * mix(0.0, 0.16, uHalo) * mix(0.22, 1.0, uLayerMix);

  if (uHasSourceImage == 1) {
    color = mix(originalFloor, color, 0.56 + uLayerMix * 0.36);
  }

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
