import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type DitheringMode = "digital" | "analog" | "hero-detail";

export type DitheringParams = {
  mode: DitheringMode;
  pixelScale: number;
  cameraSwing: number;
  ballTravel: number;
  ballSize: number;
  heroBayerMix: number;
  refinement: number;
  soften: number;
  inkColor: string;
  paperColor: string;
};

const DITHERING_MODES: DitheringMode[] = ["digital", "analog", "hero-detail"];

const DEFAULT_PARAMS: DitheringParams = {
  mode: "digital",
  pixelScale: 0.42,
  cameraSwing: 0.52,
  ballTravel: 0.58,
  ballSize: 0.6,
  heroBayerMix: 0.62,
  refinement: 0.45,
  soften: 0.72,
  inkColor: "#0f0f0f",
  paperColor: "#f6f4ee"
};

export const ditheringDefinition: EffectDefinition<DitheringParams> = {
  effectId: "dithering",
  displayName: "Dithering",
  summary:
    "Obra Dinn-inspired 1-bit hybrid dithering with digital, analog, and hero-detail presets over a moving sphere study.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "select",
      name: "mode",
      label: "Mode",
      options: DITHERING_MODES.map((value) => ({
        label: value,
        value
      })),
      description: "Digital uses screen-offset stabilization, Analog uses sphere-like mapping, Hero Detail pushes local refinement."
    },
    {
      kind: "range",
      name: "pixelScale",
      label: "Pixel Scale",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls the internal low-resolution shading grid before dithering."
    },
    {
      kind: "range",
      name: "cameraSwing",
      label: "Camera Swing",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "ballTravel",
      label: "Ball Travel",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "ballSize",
      label: "Ball Size",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "heroBayerMix",
      label: "Hero Bayer Mix",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How strongly important regions lean into a structured Bayer threshold instead of the organic field."
    },
    {
      kind: "range",
      name: "refinement",
      label: "Refinement",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Local-gather contrast emphasis inspired by the face/detail refinement described in Pope's devlog."
    },
    {
      kind: "range",
      name: "soften",
      label: "Analog Soften",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Only meaningfully affects Analog mode by blending supersampled coverage back toward a softer result."
    },
    {
      kind: "color",
      name: "inkColor",
      label: "Ink Color"
    },
    {
      kind: "color",
      name: "paperColor",
      label: "Paper Color"
    }
  ],
  uniformNames: [
    "uMode",
    "uPixelScale",
    "uCameraSwing",
    "uBallTravel",
    "uBallSize",
    "uHeroBayerMix",
    "uRefinement",
    "uSoften",
    "uInkColor",
    "uPaperColor"
  ],
  sanitizeParams(params) {
    const mode = DITHERING_MODES.includes(params?.mode as DitheringMode)
      ? (params?.mode as DitheringMode)
      : DEFAULT_PARAMS.mode;

    return {
      mode,
      pixelScale: clamp(Number(params?.pixelScale ?? DEFAULT_PARAMS.pixelScale), 0, 1),
      cameraSwing: clamp(Number(params?.cameraSwing ?? DEFAULT_PARAMS.cameraSwing), 0, 1),
      ballTravel: clamp(Number(params?.ballTravel ?? DEFAULT_PARAMS.ballTravel), 0, 1),
      ballSize: clamp(Number(params?.ballSize ?? DEFAULT_PARAMS.ballSize), 0, 1),
      heroBayerMix: clamp(Number(params?.heroBayerMix ?? DEFAULT_PARAMS.heroBayerMix), 0, 1),
      refinement: clamp(Number(params?.refinement ?? DEFAULT_PARAMS.refinement), 0, 1),
      soften: clamp(Number(params?.soften ?? DEFAULT_PARAMS.soften), 0, 1),
      inkColor: sanitizeCssColor(params?.inkColor, DEFAULT_PARAMS.inkColor),
      paperColor: sanitizeCssColor(params?.paperColor, DEFAULT_PARAMS.paperColor)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [inkR, inkG, inkB] = hexToRgb(params.inkColor);
    const [paperR, paperG, paperB] = hexToRgb(params.paperColor);

    setUniformFloat(gl, locations.uMode, DITHERING_MODES.indexOf(params.mode));
    setUniformFloat(gl, locations.uPixelScale, params.pixelScale);
    setUniformFloat(gl, locations.uCameraSwing, params.cameraSwing);
    setUniformFloat(gl, locations.uBallTravel, params.ballTravel);
    setUniformFloat(gl, locations.uBallSize, params.ballSize);
    setUniformFloat(gl, locations.uHeroBayerMix, params.heroBayerMix);
    setUniformFloat(gl, locations.uRefinement, params.refinement);
    setUniformFloat(gl, locations.uSoften, params.soften);
    setUniformVec3(gl, locations.uInkColor, inkR, inkG, inkB);
    setUniformVec3(gl, locations.uPaperColor, paperR, paperG, paperB);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uMode;
uniform float uPixelScale;
uniform float uCameraSwing;
uniform float uBallTravel;
uniform float uBallSize;
uniform float uHeroBayerMix;
uniform float uRefinement;
uniform float uSoften;
uniform vec3 uInkColor;
uniform vec3 uPaperColor;

${GLSL_COMMON}

const vec2 KERNEL_OFFSETS[8] = vec2[8](
  vec2(-1.0, -1.0),
  vec2(0.0, -1.0),
  vec2(1.0, -1.0),
  vec2(-1.0, 0.0),
  vec2(1.0, 0.0),
  vec2(-1.0, 1.0),
  vec2(0.0, 1.0),
  vec2(1.0, 1.0)
);

vec3 rotateX3(vec3 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY3(vec3 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

float cellSizePx() {
  float sourcePixels = mix(92.0, 228.0, uPixelScale);
  return max(1.0, floor(min(uResolution.x, uResolution.y) / sourcePixels));
}

vec2 sourceResolutionPx() {
  return max(vec2(1.0), floor(uResolution / cellSizePx()));
}

vec2 sourcePixelCoord(vec2 fragCoord) {
  return floor(fragCoord / cellSizePx()) + 0.5;
}

vec2 sourceSampleCoord(vec2 fragCoord) {
  return sourcePixelCoord(fragCoord) * cellSizePx();
}

float sphereHit(vec3 ro, vec3 rd, vec3 center, float radius) {
  vec3 offset = ro - center;
  float halfB = dot(offset, rd);
  float c = dot(offset, offset) - radius * radius;
  float discriminant = halfB * halfB - c;

  if (discriminant < 0.0) {
    return -1.0;
  }

  float root = sqrt(discriminant);
  float nearHit = -halfB - root;
  float farHit = -halfB + root;

  return nearHit > 0.0 ? nearHit : farHit;
}

float sampleBayer8(ivec2 p) {
  const float matrix[64] = float[64](
     0., 48., 12., 60.,  3., 51., 15., 63.,
    32., 16., 44., 28., 35., 19., 47., 31.,
     8., 56.,  4., 52., 11., 59.,  7., 55.,
    40., 24., 36., 20., 43., 27., 39., 23.,
     2., 50., 14., 62.,  1., 49., 13., 61.,
    34., 18., 46., 30., 33., 17., 45., 29.,
    10., 58.,  6., 54.,  9., 57.,  5., 53.,
    42., 26., 38., 22., 41., 25., 37., 21.
  );

  int index = ((p.y & 7) * 8) + (p.x & 7);
  return (matrix[index] + 0.5) / 64.0;
}

float sampleBlueField16(ivec2 p) {
  const float matrix[256] = float[256](
      0., 245.,  58., 228.,  12., 210.,  50., 194.,   3., 175.,  40., 159.,   8., 140.,  32., 252.,
    237., 116., 221., 108., 202.,  98., 186.,  90., 168.,  80., 151.,  72., 134., 127., 244., 119.,
     54., 214.,  26., 197.,  46., 179.,  22., 163.,  36., 144.,  16., 128.,  60., 236.,  28., 220.,
    206., 101., 190.,  93., 171.,  83., 155.,  75., 137.,  65., 249., 121., 231., 111., 213., 103.,
     10., 182.,  42., 165.,   4., 147.,  34., 131.,  14., 241.,  56., 225.,   6., 205.,  48., 189.,
    174.,  85., 158.,  77., 139.,  67., 251., 123., 233., 113., 217., 105., 199.,  95., 181.,  87.,
     38., 150.,  18., 133.,  62., 243.,  30., 227.,  52., 209.,  24., 193.,  44., 173.,  20., 157.,
    143.,  69., 255., 125., 235., 115., 219., 107., 201.,  97., 185.,  89., 167.,  79., 149.,  71.,
      2., 248.,  59., 230.,  13., 212.,  51., 196.,   1., 178.,  41., 162.,   9., 142.,  33., 254.,
    240., 118., 224., 110., 204., 100., 188.,  92., 170.,  82., 154.,  74., 136.,  64., 247., 120.,
     55., 216.,  27., 198.,  47., 180.,  23., 164.,  37., 146.,  17., 130.,  61., 239.,  29., 223.,
    208., 102., 192.,  94., 172.,  84., 156.,  76., 138.,  66., 250., 122., 232., 112., 215., 104.,
     11., 184.,  43., 166.,   5., 148.,  35., 132.,  15., 242.,  57., 226.,   7., 207.,  49., 191.,
    177.,  86., 161.,  78., 141.,  68., 253., 124., 234., 114., 218., 106., 200.,  96., 183.,  88.,
     39., 153.,  19., 135.,  63., 246.,  31., 229.,  53., 211.,  25., 195.,  45., 176.,  21., 160.,
    145.,  70., 129., 126., 238., 117., 222., 109., 203.,  99., 187.,  91., 169.,  81., 152.,  73.
  );

  int index = ((p.y & 15) * 16) + (p.x & 15);
  return (matrix[index] + 0.5) / 256.0;
}

float blueThreshold(vec2 stablePx) {
  ivec2 cell = ivec2(floor(stablePx));
  float base = sampleBlueField16(cell);
  float micro = hash21(vec2(cell) * 0.19 + vec2(uSeed * 19.7, uSeed * 11.3));
  return saturate(base + (micro - 0.5) * 0.022);
}

vec2 digitalStablePx(vec2 sourcePx, vec2 cameraRotation) {
  vec2 fov = vec2(1.28, 1.0);
  return sourcePx + sourceResolutionPx() * (cameraRotation / fov);
}

vec2 analogStablePx(vec2 sampleCoord, vec2 cameraRotation) {
  vec2 centered = (sampleCoord * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 dir = normalize(vec3(centered, 1.75));
  dir.xz = rot2(cameraRotation.x) * dir.xz;
  dir.yz = rot2(cameraRotation.y) * dir.yz;
  vec2 sphereUv = vec2(
    atan(dir.x, dir.z) / (2.0 * PI) + 0.5,
    asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5
  );

  return sphereUv * vec2(120.0, 88.0);
}

struct SceneSample {
  float lum;
  float importance;
  float edge;
};

SceneSample renderScene(vec2 fragCoord, vec2 cameraRotation) {
  vec2 sampleCoord = sourceSampleCoord(fragCoord);
  vec2 viewPlane = (sampleCoord * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);

  vec3 ro = vec3(0.0, 0.0, 2.7);
  vec3 rd = normalize(vec3(viewPlane, -1.72));
  rd.xz = rot2(cameraRotation.x) * rd.xz;
  rd.yz = rot2(cameraRotation.y) * rd.yz;

  float radius = mix(0.46, 0.78, uBallSize);
  float travel = mix(0.0, 0.62, uBallTravel);
  vec3 sphereCenter = vec3(
    sin(uTime * 0.84) * travel,
    sin(uTime * 1.16 + 0.6) * 0.06 * travel,
    cos(uTime * 0.44 + 0.7) * 0.08 * travel
  );

  float paperNoise = noise(sampleCoord * 0.02 + vec2(uSeed * 17.0, uSeed * 9.0));
  float background = 0.985 + (paperNoise - 0.5) * 0.018;

  vec2 shadowUv = viewPlane - vec2(sphereCenter.x * 0.34 + cameraRotation.x * 0.22, -0.62 + sphereCenter.y * 0.08);
  float shadow = exp(-dot(shadowUv / vec2(0.42 + radius * 0.34, 0.07 + radius * 0.04), shadowUv));
  background -= shadow * 0.055;

  SceneSample sceneState = SceneSample(background, 0.0, 0.0);
  float hit = sphereHit(ro, rd, sphereCenter, radius);

  if (hit > 0.0) {
    vec3 position = ro + rd * hit;
    vec3 normal = normalize(position - sphereCenter);
    vec3 spun = rotateY3(rotateX3(normal, uTime * 0.94), uTime * 1.27);
    vec3 lightDir = normalize(vec3(-0.42, 0.62, 0.66));
    vec3 fillDir = normalize(vec3(0.28, -0.18, 0.94));

    float diffuse = saturate(dot(normal, lightDir));
    float fill = saturate(dot(normal, fillDir));
    float fresnel = pow(1.0 - saturate(dot(normal, -rd)), 2.8);
    float stripeA = 0.5 + 0.5 * sin(spun.x * 12.0 + spun.y * 3.0 - uTime * 1.35);
    float stripeB = 0.5 + 0.5 * sin(spun.z * 10.0 - spun.x * 4.0 + uTime * 1.02);
    float grooves = smoothstep(0.74, 0.9, mix(stripeA, stripeB, 0.35));
    float silhouette = 1.0 - smoothstep(0.12, 0.34, normal.z);
    float highlight = pow(saturate(dot(reflect(-lightDir, normal), -rd)), 20.0) * 0.08;

    sceneState.lum = 0.035 + diffuse * 0.9 + fill * 0.08 + fresnel * 0.04 + grooves * 0.05 + highlight;
    sceneState.importance = saturate(0.48 + diffuse * 0.28 + fresnel * 0.28 + grooves * 0.14);
    sceneState.edge = max(silhouette, grooves * smoothstep(0.35, 0.75, diffuse) * 0.36);
  }

  sceneState.lum = saturate(sceneState.lum);
  sceneState.importance = saturate(sceneState.importance);
  sceneState.edge = saturate(sceneState.edge);
  return sceneState;
}

float refinedLuma(vec2 fragCoord, vec2 cameraRotation, SceneSample centerSample) {
  float detailMode = uMode > 1.5 ? 1.0 : 0.0;
  float refineAmount = uRefinement * detailMode * centerSample.importance;

  if (refineAmount <= 0.001) {
    return centerSample.lum;
  }

  float stepPx = cellSizePx();
  float total = centerSample.lum;
  float edgeTotal = centerSample.edge;

  for (int index = 0; index < 8; index += 1) {
    SceneSample neighbor = renderScene(fragCoord + KERNEL_OFFSETS[index] * stepPx, cameraRotation);
    total += neighbor.lum;
    edgeTotal += neighbor.edge;
  }

  float mean = total / 9.0;
  float edgeMean = edgeTotal / 9.0;
  float contrast = centerSample.lum - mean;
  float boost = smoothstep(0.015, 0.18, abs(contrast) + edgeMean * 0.16) * refineAmount;

  return saturate(centerSample.lum + contrast * mix(0.35, 1.45, boost) + edgeMean * boost * 0.08);
}

float thresholdForSample(vec2 fragCoord, vec2 cameraRotation, float importance) {
  vec2 sourcePx = sourcePixelCoord(fragCoord);
  vec2 sampleCoord = sourceSampleCoord(fragCoord);
  vec2 stablePx = uMode < 0.5 ? digitalStablePx(sourcePx, cameraRotation) : analogStablePx(sampleCoord, cameraRotation);
  float organic = blueThreshold(stablePx);
  float structured = sampleBayer8(ivec2(floor(stablePx)));
  float heroMix = mix(0.04, 0.88, importance) * mix(0.18, 1.0, uHeroBayerMix);

  if (uMode > 1.5) {
    heroMix = max(heroMix, importance * mix(0.45, 0.95, uHeroBayerMix));
  }

  return mix(organic, structured, saturate(heroMix));
}

float applyBinaryEdge(float bit, float edgeStrength) {
  float edgeBit = step(0.34, edgeStrength);
  return min(bit, 1.0 - edgeBit);
}

float resolvedCoverage(vec2 fragCoord, vec2 cameraRotation) {
  if (uMode > 0.5 && uMode < 1.5) {
    const vec2 sampleOffsets[4] = vec2[4](
      vec2(-0.35, -0.35),
      vec2(0.35, -0.35),
      vec2(-0.35, 0.35),
      vec2(0.35, 0.35)
    );

    float sum = 0.0;
    float cellSize = cellSizePx();

    for (int index = 0; index < 4; index += 1) {
      vec2 offsetCoord = fragCoord + sampleOffsets[index] * cellSize * 0.6;
      SceneSample scene = renderScene(offsetCoord, cameraRotation);
      float threshold = thresholdForSample(offsetCoord, cameraRotation, scene.importance);
      float bit = step(threshold, scene.lum);
      bit = applyBinaryEdge(bit, scene.edge);
      sum += bit;
    }

    float coverage = sum * 0.25;
    float resolveThreshold = mix(0.5, 0.68, uSoften);
    return step(resolveThreshold, coverage);
  }

  SceneSample scene = renderScene(fragCoord, cameraRotation);
  float lum = refinedLuma(fragCoord, cameraRotation, scene);
  float threshold = thresholdForSample(fragCoord, cameraRotation, scene.importance);
  float bit = step(threshold, lum);
  return applyBinaryEdge(bit, scene.edge * mix(0.82, 1.08, uHeroBayerMix));
}

void main() {
  vec2 cameraRotation = vec2(
    sin(uTime * 0.57 + uSeed * 5.1) * mix(0.0, 0.52, uCameraSwing),
    cos(uTime * 0.41 + uSeed * 3.7) * mix(0.0, 0.24, uCameraSwing)
  );

  float coverage = resolvedCoverage(gl_FragCoord.xy, cameraRotation);
  vec2 vignetteUv = gl_FragCoord.xy / uResolution.xy;
  float vignette = 1.0 - smoothstep(0.2, 0.95, distance(vignetteUv, vec2(0.5)));
  vec3 color = mix(uInkColor, uPaperColor, coverage);
  color = mix(color * 0.94, color, vignette);

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
