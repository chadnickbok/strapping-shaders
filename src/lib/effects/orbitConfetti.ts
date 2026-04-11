import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { GLSL_COMMON, MAX_SHARED_PALETTE_COLORS } from "./sharedShaderUtils";

export type OrbitConfettiParams = {
  cellDensity: number;
  orbitRadius: number;
  particleSize: number;
  speed: number;
  trails: number;
  jitter: number;
  palette: string[];
};

const DEFAULT_PARAMS: OrbitConfettiParams = {
  cellDensity: 0.4,
  orbitRadius: 0.3,
  particleSize: 0.18,
  speed: 0.35,
  trails: 0.12,
  jitter: 0.1,
  palette: ["#ffd166", "#ef476f", "#06d6a0"]
};

export const orbitConfettiDefinition: EffectDefinition<OrbitConfettiParams> = {
  effectId: "orbit-confetti",
  displayName: "Orbit Confetti",
  summary: "Cell-local orbit systems with bright particles, jitter, and short trails.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    { kind: "range", name: "cellDensity", label: "Cell Density", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "orbitRadius", label: "Orbit Radius", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "particleSize", label: "Particle Size", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "speed", label: "Speed", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "trails", label: "Trails", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "jitter", label: "Jitter", min: 0, max: 1, step: 0.01 },
    { kind: "palette", name: "palette", label: "Palette", minLength: 2, maxLength: 5 }
  ],
  uniformNames: [
    "uCellDensity",
    "uOrbitRadius",
    "uParticleSize",
    "uSpeed",
    "uTrails",
    "uJitter",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      cellDensity: clamp(Number(params?.cellDensity ?? DEFAULT_PARAMS.cellDensity), 0, 1),
      orbitRadius: clamp(Number(params?.orbitRadius ?? DEFAULT_PARAMS.orbitRadius), 0, 1),
      particleSize: clamp(Number(params?.particleSize ?? DEFAULT_PARAMS.particleSize), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      trails: clamp(Number(params?.trails ?? DEFAULT_PARAMS.trails), 0, 1),
      jitter: clamp(Number(params?.jitter ?? DEFAULT_PARAMS.jitter), 0, 1),
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 2, 5)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uCellDensity, params.cellDensity);
    setUniformFloat(gl, locations.uOrbitRadius, params.orbitRadius);
    setUniformFloat(gl, locations.uParticleSize, params.particleSize);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformFloat(gl, locations.uTrails, params.trails);
    setUniformFloat(gl, locations.uJitter, params.jitter);
    setUniformInt(gl, locations.uPaletteCount, palette.length);
    setUniformVec3Array(
      gl,
      locations["uPalette[0]"],
      colorsToFloatArray(palette, MAX_SHARED_PALETTE_COLORS, DEFAULT_PARAMS.palette[0])
    );
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uCellDensity;
uniform float uOrbitRadius;
uniform float uParticleSize;
uniform float uSpeed;
uniform float uTrails;
uniform float uJitter;
uniform int uPaletteCount;
uniform vec3 uPalette[${MAX_SHARED_PALETTE_COLORS}];

${GLSL_COMMON}

vec3 paletteAt(float index) {
  int colorIndex = int(mod(index, float(max(uPaletteCount, 1))));
  return uPalette[colorIndex];
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution.xy, vec2(1.0));
  float density = mix(3.0, 10.0, uCellDensity);
  vec2 cellUv = uv * density;
  vec2 baseCell = floor(cellUv);
  float speed = mix(0.15, 1.3, uSpeed);
  float radius = mix(0.03, 0.18, uOrbitRadius) / density;
  float size = mix(0.005, 0.028, uParticleSize) * min(uResolution.x, uResolution.y);
  float field = 0.0;
  vec3 color = vec3(0.0);

  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 cell = baseCell + vec2(float(x), float(y));
      vec2 random = hash22(cell + uSeed * 13.0);
      vec2 center = (cell + 0.5 + (random - 0.5) * uJitter * 0.65) / density;
      float orbitPhase = random.x * PI * 2.0 + uTime * speed * mix(0.8, 1.4, random.y);
      vec2 orbit = vec2(cos(orbitPhase), sin(orbitPhase)) * radius;
      vec2 particle = center + orbit;
      vec2 delta = (uv - particle) * uResolution;
      float dotField = exp(-dot(delta, delta) / max(size * size, 0.001));
      float trailPhase = orbitPhase - uTrails * 0.75;
      vec2 trailParticle = center + vec2(cos(trailPhase), sin(trailPhase)) * radius;
      vec2 trailDelta = (uv - trailParticle) * uResolution;
      float trail = exp(-dot(trailDelta, trailDelta) / max(size * size * 1.8, 0.001)) * uTrails;
      float total = dotField + trail;
      vec3 particleColor = paletteAt(floor(random.x * float(uPaletteCount)));
      color += particleColor * total;
      field += total;
    }
  }

  float alpha = saturate(field);
  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
};
