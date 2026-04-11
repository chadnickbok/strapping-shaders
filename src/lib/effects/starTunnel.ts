import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type StarTunnelParams = {
  density: number;
  streakLength: number;
  speed: number;
  depth: number;
  twinkle: number;
  tint: string;
  backgroundColor: string;
};

const DEFAULT_PARAMS: StarTunnelParams = {
  density: 0.38,
  streakLength: 0.28,
  speed: 0.45,
  depth: 0.5,
  twinkle: 0.08,
  tint: "#d9ecff",
  backgroundColor: "#02040a"
};

export const starTunnelDefinition: EffectDefinition<StarTunnelParams> = {
  effectId: "star-tunnel",
  displayName: "Star Tunnel",
  summary: "Layered radial starfield with depth-scaled motion and tunnel streaks.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    { kind: "range", name: "density", label: "Density", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "streakLength", label: "Streak Length", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "speed", label: "Speed", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "depth", label: "Depth", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "twinkle", label: "Twinkle", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "tint", label: "Tint" },
    { kind: "color", name: "backgroundColor", label: "Background Color" }
  ],
  uniformNames: [
    "uDensity",
    "uStreakLength",
    "uSpeed",
    "uDepth",
    "uTwinkle",
    "uTint",
    "uBackgroundColor"
  ],
  sanitizeParams(params) {
    return {
      density: clamp(Number(params?.density ?? DEFAULT_PARAMS.density), 0, 1),
      streakLength: clamp(Number(params?.streakLength ?? DEFAULT_PARAMS.streakLength), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      depth: clamp(Number(params?.depth ?? DEFAULT_PARAMS.depth), 0, 1),
      twinkle: clamp(Number(params?.twinkle ?? DEFAULT_PARAMS.twinkle), 0, 1),
      tint: sanitizeCssColor(params?.tint, DEFAULT_PARAMS.tint),
      backgroundColor: sanitizeCssColor(params?.backgroundColor, DEFAULT_PARAMS.backgroundColor)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [tintR, tintG, tintB] = hexToRgb(params.tint);
    const [backgroundR, backgroundG, backgroundB] = hexToRgb(params.backgroundColor);

    setUniformFloat(gl, locations.uDensity, params.density);
    setUniformFloat(gl, locations.uStreakLength, params.streakLength);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformFloat(gl, locations.uDepth, params.depth);
    setUniformFloat(gl, locations.uTwinkle, params.twinkle);
    setUniformVec3(gl, locations.uTint, tintR, tintG, tintB);
    setUniformVec3(gl, locations.uBackgroundColor, backgroundR, backgroundG, backgroundB);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform float uStreakLength;
uniform float uSpeed;
uniform float uDepth;
uniform float uTwinkle;
uniform vec3 uTint;
uniform vec3 uBackgroundColor;

${GLSL_COMMON}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float travel = uTime * mix(0.2, 1.8, uSpeed);
  vec3 color = uBackgroundColor;
  float field = 0.0;

  for (int layer = 0; layer < 6; layer += 1) {
    float depthLayer = float(layer) / 5.0;
    if (depthLayer > mix(0.35, 1.0, uDepth)) {
      continue;
    }

    for (int starIndex = 0; starIndex < 24; starIndex += 1) {
      float star = float(starIndex);
      vec2 seed = vec2(star + depthLayer * 37.0, depthLayer * 11.0 + uSeed * 17.0);
      float angle = hash21(seed) * PI * 2.0;
      float lane = hash21(seed + 7.3);
      float baseRadius = fract(hash21(seed + 11.1) + travel * (0.12 + depthLayer * 0.92) * mix(0.25, 1.5, uDensity));
      baseRadius = 1.0 - baseRadius;
      vec2 center = vec2(cos(angle), sin(angle)) * baseRadius * (0.18 + depthLayer * 1.18);
      vec2 direction = normalize(center + vec2(0.0001));
      vec2 delta = uv - center;
      float radial = dot(delta, direction);
      float lateral = length(delta - direction * radial);
      float streak = exp(-pow(lateral / max(0.004, 0.01 + lane * 0.014), 2.0));
      streak *= exp(-max(radial, 0.0) / max(0.04, 0.05 + uStreakLength * 0.22));
      streak *= step(0.0, radial + 0.02);
      float twinkle = 0.9 + sin(uTime * (2.0 + lane * 4.0) + star) * uTwinkle;
      field += streak * twinkle;
    }
  }

  color += uTint * field;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
};
