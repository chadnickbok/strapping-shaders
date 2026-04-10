import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";

export type VoronoiCausticsParams = {
  waterTint: string;
  lightTint: string;
  scale: number;
  lineWidth: number;
  contrast: number;
  distortion: number;
  driftSpeed: number;
  halo: number;
};

const DEFAULT_PARAMS: VoronoiCausticsParams = {
  waterTint: "#7cc7df",
  lightTint: "#f7fbff",
  scale: 0.42,
  lineWidth: 0.44,
  contrast: 0.62,
  distortion: 0.3,
  driftSpeed: 0.22,
  halo: 0.14
};

export const voronoiCausticsDefinition: EffectDefinition<VoronoiCausticsParams> = {
  effectId: "voronoi-caustics",
  displayName: "Voronoi Caustics",
  summary: "Stylized cellular caustic webs with drifting Voronoi ridges, quiet gaps, and water-tinted depth.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "color",
      name: "waterTint",
      label: "Water Tint",
      description: "Base tint for the darker substrate beneath the ridge network."
    },
    {
      kind: "color",
      name: "lightTint",
      label: "Light Tint",
      description: "Tint for the brighter cellular ridges and halo."
    },
    {
      kind: "range",
      name: "scale",
      label: "Scale",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls how tightly packed the Voronoi cells feel in frame."
    },
    {
      kind: "range",
      name: "lineWidth",
      label: "Line Width",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Broadens or narrows the bright cellular ridge network."
    },
    {
      kind: "range",
      name: "contrast",
      label: "Contrast",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Pushes ridge brightness and web separation without changing the cell scale."
    },
    {
      kind: "range",
      name: "distortion",
      label: "Distortion",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Domain warp amount applied before the cellular web is extracted."
    },
    {
      kind: "range",
      name: "driftSpeed",
      label: "Drift Speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Rate of the slow web drift across the calmer substrate."
    },
    {
      kind: "range",
      name: "halo",
      label: "Halo",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Soft fill around the brightest ridge intersections."
    }
  ],
  uniformNames: [
    "uWaterTint",
    "uLightTint",
    "uScale",
    "uLineWidth",
    "uContrast",
    "uDistortion",
    "uDriftSpeed",
    "uHalo"
  ],
  sanitizeParams(params) {
    return {
      waterTint: sanitizeHexColor(params?.waterTint, DEFAULT_PARAMS.waterTint),
      lightTint: sanitizeHexColor(params?.lightTint, DEFAULT_PARAMS.lightTint),
      scale: clamp(Number(params?.scale ?? DEFAULT_PARAMS.scale), 0, 1),
      lineWidth: clamp(Number(params?.lineWidth ?? DEFAULT_PARAMS.lineWidth), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      distortion: clamp(Number(params?.distortion ?? DEFAULT_PARAMS.distortion), 0, 1),
      driftSpeed: clamp(Number(params?.driftSpeed ?? DEFAULT_PARAMS.driftSpeed), 0, 1),
      halo: clamp(Number(params?.halo ?? DEFAULT_PARAMS.halo), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [waterR, waterG, waterB] = hexToRgb(params.waterTint);
    const [lightR, lightG, lightB] = hexToRgb(params.lightTint);

    setUniformVec3(gl, locations.uWaterTint, waterR, waterG, waterB);
    setUniformVec3(gl, locations.uLightTint, lightR, lightG, lightB);
    setUniformFloat(gl, locations.uScale, params.scale);
    setUniformFloat(gl, locations.uLineWidth, params.lineWidth);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uDistortion, params.distortion);
    setUniformFloat(gl, locations.uDriftSpeed, params.driftSpeed);
    setUniformFloat(gl, locations.uHalo, params.halo);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform vec3 uWaterTint;
uniform vec3 uLightTint;
uniform float uScale;
uniform float uLineWidth;
uniform float uContrast;
uniform float uDistortion;
uniform float uDriftSpeed;
uniform float uHalo;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
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

  float a = hash22(cell).x;
  float b = hash22(cell + vec2(1.0, 0.0)).x;
  float c = hash22(cell + vec2(0.0, 1.0)).x;
  float d = hash22(cell + vec2(1.0, 1.0)).x;

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

float causticBand(vec2 field, float lineWidth, float contrast) {
  float edge = max(field.y - field.x, 0.0);
  float width = mix(0.055, 0.24, lineWidth);
  float band = 1.0 - smoothstep(0.0, width, edge);
  return pow(saturate(band), mix(1.1, 3.25, contrast));
}

float causticHalo(vec2 field, float halo) {
  float edge = max(field.y - field.x, 0.0);
  float width = mix(0.04, 0.26, halo);
  float band = 1.0 - smoothstep(0.02, width, edge);
  return band * band;
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 centered = (vUv - 0.5) * aspect;
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318));
  float drift = uTime * mix(0.0, 0.26, uDriftSpeed);
  float density = mix(2.8, 7.5, uScale);

  vec2 macroUv = centered * 1.05 + seedOffset * 1.7;
  vec2 macroWarp = vec2(
    fbm(macroUv * 0.82 + vec2(0.0, drift * 0.18)),
    fbm(macroUv.yx * 0.82 + vec2(4.2, -3.4) + vec2(-drift * 0.12, drift * 0.16))
  ) - 0.5;

  vec2 domain = centered * density + seedOffset * 4.1;
  domain += macroWarp * mix(0.18, 1.15, uDistortion);
  domain += vec2(drift * 0.14, -drift * 0.08);

  vec2 detailWarp = vec2(
    fbm(domain * 0.42 + vec2(9.4, -2.1)),
    fbm(domain.yx * 0.42 + vec2(-6.7, 3.8))
  ) - 0.5;

  vec2 fieldA = worley(domain + detailWarp * 0.58);
  vec2 fieldB = worley(domain * 1.08 - detailWarp.yx * 0.42 + vec2(6.1, -3.6));

  float webA = causticBand(fieldA, uLineWidth, uContrast);
  float webB = causticBand(fieldB, min(1.0, uLineWidth * 0.78 + 0.12), min(1.0, uContrast * 0.92 + 0.08));
  float haloA = causticHalo(fieldA, uHalo);
  float haloB = causticHalo(fieldB, min(1.0, uHalo * 0.82 + 0.04));
  float junctionA = pow(saturate(1.0 - fieldA.x * 2.3), 4.0) * webA;
  float junctionB = pow(saturate(1.0 - fieldB.x * 2.15), 4.0) * webB;

  float breakup = smoothstep(0.18, 0.86, fbm(centered * 0.95 - macroWarp * 1.15 + seedOffset * 2.0 + drift * 0.05));
  float quietZones = smoothstep(0.08, 0.82, fbm(centered * 0.55 + seedOffset * 2.7 - macroWarp * 0.55 - drift * 0.03));
  float web = (mix(webA, webB, 0.28) + max(webA, webB) * 0.22) * (0.52 + breakup * 0.48);
  float halo = (mix(haloA, haloB, 0.24) + max(haloA, haloB) * 0.14) * (0.55 + breakup * 0.3);
  float junction = mix(junctionA, junctionB, 0.22);

  web *= mix(0.24, 1.0, quietZones);
  halo *= mix(0.38, 0.92, quietZones);

  float substrateNoise = fbm(centered * mix(1.35, 2.8, uScale) - macroWarp * 1.4 + seedOffset * 1.3);
  float substrateMask = smoothstep(0.16, 0.88, substrateNoise);
  vec3 deepColor = mix(uWaterTint * 0.18, vec3(0.018, 0.08, 0.1), 0.52);
  vec3 midColor = uWaterTint * 0.82 + vec3(0.025, 0.05, 0.055);
  vec3 color = mix(deepColor, midColor, substrateMask);

  vec3 ridgeTint = mix(uLightTint, vec3(1.0), 0.22);
  float ridgeEnergy = web * (0.32 + uContrast * 0.68) + junction * (0.18 + uContrast * 0.3);
  float haloEnergy = halo * mix(0.02, 0.18, uHalo);

  color += ridgeTint * ridgeEnergy;
  color += mix(ridgeTint, vec3(1.0), 0.35) * haloEnergy;

  float vignette = smoothstep(1.28, 0.16, length(centered));
  color *= 0.82 + vignette * 0.18;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
