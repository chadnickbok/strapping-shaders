import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { MAX_SHARED_PALETTE_COLORS, GLSL_COMMON } from "./sharedShaderUtils";

export type MoireSilkParams = {
  palette: string[];
  lineDensity: number;
  rotationDeg: number;
  interference: number;
  jitter: number;
  sheen: number;
  drift: number;
  opacity: number;
};

const DEFAULT_PARAMS: MoireSilkParams = {
  palette: ["#11131d", "#384667", "#a79fcc", "#f0dfcb"],
  lineDensity: 0.46,
  rotationDeg: 22,
  interference: 0.66,
  jitter: 0.18,
  sheen: 0.48,
  drift: 0.24,
  opacity: 1
};

export const moireSilkDefinition: EffectDefinition<MoireSilkParams> = {
  effectId: "moire-silk",
  displayName: "Moire Silk",
  summary: "Layered line fields with rotation offsets, watery moire bands, and cloth-like sheen.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "palette",
      name: "palette",
      label: "Palette",
      minLength: 3,
      maxLength: MAX_SHARED_PALETTE_COLORS,
      description: "Ordered ramp used for the silk body, banding, and highlights."
    },
    {
      kind: "range",
      name: "lineDensity",
      label: "Line Density",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Frequency of the underlying line fields."
    },
    {
      kind: "range",
      name: "rotationDeg",
      label: "Rotation",
      min: 0,
      max: 180,
      step: 1,
      description: "Primary weave direction for the overlaid line systems."
    },
    {
      kind: "range",
      name: "interference",
      label: "Interference",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Amount of scale and angle offset between the fields."
    },
    {
      kind: "range",
      name: "jitter",
      label: "Jitter",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Noise-driven breakup that keeps the moire from reading as a perfect grid."
    },
    {
      kind: "range",
      name: "sheen",
      label: "Sheen",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Directional silk highlight layered on top of the interference."
    },
    {
      kind: "range",
      name: "drift",
      label: "Drift",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Subtle motion through the line and sheen fields."
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
    "uLineDensity",
    "uRotationDeg",
    "uInterference",
    "uJitter",
    "uSheen",
    "uDrift",
    "uOpacity",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 3, MAX_SHARED_PALETTE_COLORS),
      lineDensity: clamp(Number(params?.lineDensity ?? DEFAULT_PARAMS.lineDensity), 0, 1),
      rotationDeg: clamp(Number(params?.rotationDeg ?? DEFAULT_PARAMS.rotationDeg), 0, 180),
      interference: clamp(Number(params?.interference ?? DEFAULT_PARAMS.interference), 0, 1),
      jitter: clamp(Number(params?.jitter ?? DEFAULT_PARAMS.jitter), 0, 1),
      sheen: clamp(Number(params?.sheen ?? DEFAULT_PARAMS.sheen), 0, 1),
      drift: clamp(Number(params?.drift ?? DEFAULT_PARAMS.drift), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uLineDensity, params.lineDensity);
    setUniformFloat(gl, locations.uRotationDeg, params.rotationDeg);
    setUniformFloat(gl, locations.uInterference, params.interference);
    setUniformFloat(gl, locations.uJitter, params.jitter);
    setUniformFloat(gl, locations.uSheen, params.sheen);
    setUniformFloat(gl, locations.uDrift, params.drift);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
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
uniform float uLineDensity;
uniform float uRotationDeg;
uniform float uInterference;
uniform float uJitter;
uniform float uSheen;
uniform float uDrift;
uniform float uOpacity;
uniform int uPaletteCount;
uniform vec3 uPalette[6];

${GLSL_COMMON}

vec3 paletteAt(float t) {
  float segments = float(max(uPaletteCount - 1, 1));
  float scaled = clamp(t, 0.0, 0.9999) * segments;
  int index = int(floor(scaled));
  float blend = fract(scaled);
  vec3 startColor = uPalette[index];
  vec3 endColor = uPalette[min(index + 1, uPaletteCount - 1)];
  return mix(startColor, endColor, blend);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float drift = uTime * mix(0.0, 0.22, uDrift);
  float angleA = radians(uRotationDeg);
  float angleB = -angleA * 0.72 + mix(0.05, 0.28, uInterference);
  vec2 warpedUv = uv + (fbm(uv * 2.2 + uSeed * 11.0) - 0.5) * mix(0.0, 0.18, uJitter);
  float jitterField = fbm(warpedUv * 5.6 + vec2(drift, -drift * 0.6) + uSeed * 5.0);
  vec2 fieldA = rot2(angleA) * warpedUv;
  vec2 fieldB = rot2(angleB) * warpedUv * mix(1.02, 1.22, uInterference);
  float frequency = mix(22.0, 120.0, uLineDensity);
  float linesA = 0.5 + 0.5 * cos(fieldA.x * frequency + jitterField * mix(0.0, 3.2, uJitter) + drift);
  float linesB = 0.5 + 0.5 * cos(fieldB.x * frequency * (1.05 + uInterference * 0.18) - jitterField * 2.6 - drift * 0.7);
  float moire = smoothstep(0.04, 0.96, abs(linesA - linesB));
  float silkWave = 0.5 + 0.5 * cos((fieldA.y * 7.5 + fieldB.x * 2.3) + jitterField * 4.4 - drift * 0.45);
  vec2 sheenDir = normalize(vec2(cos(angleA + 0.6), sin(angleA + 0.6)));
  float sheen = pow(saturate(0.5 + 0.5 * dot(normalize(warpedUv + 0.0001), sheenDir)), 3.2);
  sheen *= mix(0.0, 1.0, uSheen);
  float colorPosition = clamp(moire * 0.62 + silkWave * 0.2 + sheen * 0.18, 0.0, 1.0);
  vec3 base = paletteAt(colorPosition);
  vec3 accent = paletteAt(clamp(colorPosition + moire * 0.18, 0.0, 1.0));
  vec3 color = mix(base * 0.72, base, 0.82);
  color = mix(color, accent, moire * 0.4);
  color += sheen * 0.14;
  float vignette = 1.0 - smoothstep(0.7, 1.35, length(warpedUv));
  color *= 0.78 + vignette * 0.28;

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
