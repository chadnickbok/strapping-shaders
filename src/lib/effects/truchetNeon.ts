import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type TruchetNeonParams = {
  tileSize: number;
  tubeWidth: number;
  glow: number;
  mazeBias: number;
  speed: number;
  tint: string;
  backgroundColor: string;
};

const DEFAULT_PARAMS: TruchetNeonParams = {
  tileSize: 0.4,
  tubeWidth: 0.18,
  glow: 0.45,
  mazeBias: 0.5,
  speed: 0.12,
  tint: "#5ff3ff",
  backgroundColor: "#071018"
};

export const truchetNeonDefinition: EffectDefinition<TruchetNeonParams> = {
  effectId: "truchet-neon",
  displayName: "Truchet Neon",
  summary: "Quarter-arc Truchet neon tubes with halo and maze continuity bias.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    { kind: "range", name: "tileSize", label: "Tile Size", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "tubeWidth", label: "Tube Width", min: 0.05, max: 0.4, step: 0.01 },
    { kind: "range", name: "glow", label: "Glow", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "mazeBias", label: "Maze Bias", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "speed", label: "Speed", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "tint", label: "Tint" },
    { kind: "color", name: "backgroundColor", label: "Background Color" }
  ],
  uniformNames: [
    "uTileSize",
    "uTubeWidth",
    "uGlow",
    "uMazeBias",
    "uSpeed",
    "uTint",
    "uBackgroundColor"
  ],
  sanitizeParams(params) {
    return {
      tileSize: clamp(Number(params?.tileSize ?? DEFAULT_PARAMS.tileSize), 0, 1),
      tubeWidth: clamp(Number(params?.tubeWidth ?? DEFAULT_PARAMS.tubeWidth), 0.05, 0.4),
      glow: clamp(Number(params?.glow ?? DEFAULT_PARAMS.glow), 0, 1),
      mazeBias: clamp(Number(params?.mazeBias ?? DEFAULT_PARAMS.mazeBias), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      tint: sanitizeCssColor(params?.tint, DEFAULT_PARAMS.tint),
      backgroundColor: sanitizeCssColor(params?.backgroundColor, DEFAULT_PARAMS.backgroundColor)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [tintR, tintG, tintB] = hexToRgb(params.tint);
    const [backgroundR, backgroundG, backgroundB] = hexToRgb(params.backgroundColor);

    setUniformFloat(gl, locations.uTileSize, params.tileSize);
    setUniformFloat(gl, locations.uTubeWidth, params.tubeWidth);
    setUniformFloat(gl, locations.uGlow, params.glow);
    setUniformFloat(gl, locations.uMazeBias, params.mazeBias);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformVec3(gl, locations.uTint, tintR, tintG, tintB);
    setUniformVec3(gl, locations.uBackgroundColor, backgroundR, backgroundG, backgroundB);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uTileSize;
uniform float uTubeWidth;
uniform float uGlow;
uniform float uMazeBias;
uniform float uSpeed;
uniform vec3 uTint;
uniform vec3 uBackgroundColor;

${GLSL_COMMON}

float arcDistance(vec2 local, vec2 center) {
  return abs(length(local - center) - 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution.xy, vec2(1.0));
  float density = mix(5.0, 14.0, 1.0 - uTileSize);
  vec2 gridUv = uv * density;
  vec2 cell = floor(gridUv);
  vec2 local = fract(gridUv);
  float orientation = step(0.5 - uMazeBias * 0.2, hash21(cell + uSeed * 11.0 + floor(uTime * mix(0.0, 0.6, uSpeed))));
  float distanceToArc = orientation < 0.5
    ? min(arcDistance(local, vec2(0.0, 0.0)), arcDistance(local, vec2(1.0, 1.0)))
    : min(arcDistance(local, vec2(1.0, 0.0)), arcDistance(local, vec2(0.0, 1.0)));
  float width = uTubeWidth * 0.32;
  float core = 1.0 - smoothstep(width, width + 0.012, distanceToArc);
  float halo = exp(-distanceToArc / max(0.01, 0.04 + uGlow * 0.14)) * (0.12 + uGlow * 0.62);
  vec3 color = mix(uBackgroundColor, uTint * (0.85 + halo * 0.4), saturate(core + halo));
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
