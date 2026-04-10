import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";

export type AuroraFieldParams = {
  palette: string[];
  density: number;
  flow: number;
  contrast: number;
  opacity: number;
};

const DEFAULT_PARAMS: AuroraFieldParams = {
  palette: ["#102542", "#2d6cdf", "#6ce2d9", "#f5f1c8"],
  density: 0.45,
  flow: 0.5,
  contrast: 0.55,
  opacity: 1
};

const MAX_PALETTE_COLORS = 6;

export const auroraFieldDefinition: EffectDefinition<AuroraFieldParams> = {
  effectId: "aurora-field",
  displayName: "Aurora Field",
  summary: "Procedural atmospheric ribbons with palette mapping and soft motion.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "palette",
      name: "palette",
      label: "Palette",
      minLength: 3,
      maxLength: MAX_PALETTE_COLORS,
      description: "Ordered band colors used across the field."
    },
    {
      kind: "range",
      name: "density",
      label: "Density",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Controls ribbon packing, field scale, and overall band frequency."
    },
    {
      kind: "range",
      name: "flow",
      label: "Flow",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Couples motion rate with warp intensity for the ribbon field."
    },
    {
      kind: "range",
      name: "contrast",
      label: "Contrast",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Pushes highlight emphasis and separation away from flat gray."
    },
    {
      kind: "range",
      name: "opacity",
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Sets the final fragment alpha."
    }
  ],
  uniformNames: [
    "uDensity",
    "uFlow",
    "uContrast",
    "uOpacity",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 3, MAX_PALETTE_COLORS),
      density: clamp(Number(params?.density ?? DEFAULT_PARAMS.density), 0, 1),
      flow: clamp(Number(params?.flow ?? DEFAULT_PARAMS.flow), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    setUniformFloat(gl, locations.uDensity, params.density);
    setUniformFloat(gl, locations.uFlow, params.flow);
    setUniformFloat(gl, locations.uContrast, params.contrast);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
    setUniformInt(gl, locations.uPaletteCount, params.palette.length);
    setUniformVec3Array(
      gl,
      locations["uPalette[0]"],
      colorsToFloatArray(params.palette, MAX_PALETTE_COLORS, DEFAULT_PARAMS.palette[0])
    );
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform float uFlow;
uniform float uContrast;
uniform float uOpacity;
uniform int uPaletteCount;
uniform vec3 uPalette[6];

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
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
    p = p * 2.03 + vec2(13.1, 5.7);
    amplitude *= 0.55;
  }

  return total;
}

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
  float density = mix(0.75, 2.7, uDensity);
  float flowSpeed = mix(0.08, 0.4, uFlow);
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318)) * 2.75;
  float drift = uTime * flowSpeed;
  vec2 fieldUv = uv * density + seedOffset;
  float warpA = fbm(fieldUv + vec2(0.0, drift * 0.9));
  float warpB = fbm(fieldUv.yx * 1.35 - vec2(drift * 0.4, -drift * 0.7));
  vec2 warp = vec2(warpA - 0.5, warpB - 0.5);
  float ribbon = uv.y * (1.25 + uDensity * 1.9);
  ribbon += warp.y * mix(0.55, 1.8, uFlow);
  ribbon += sin((uv.x + warp.x * 0.85) * (1.8 + uDensity * 2.8) + drift) * 0.18;
  float glowField = fbm(fieldUv * 1.9 + warp * 2.1 + drift * 0.35);
  float colorPosition = smoothstep(-0.75, 1.25, ribbon * 0.5 + glowField * 0.65);
  vec3 base = paletteAt(clamp(colorPosition * 0.42, 0.0, 1.0)) * 0.4;
  vec3 color = paletteAt(colorPosition);
  vec3 accent = paletteAt(clamp(colorPosition + glowField * 0.22, 0.0, 1.0));
  color = mix(base, color, 0.82);
  color = mix(color, accent, glowField * 0.45);
  float highlight = smoothstep(0.28, 0.92, glowField) * mix(0.3, 0.95, uContrast);
  color += highlight * 0.18;
  float vignette = 1.0 - smoothstep(0.58, 1.34, length(uv * vec2(1.0, 1.15)));
  color *= 0.68 + vignette * 0.42;
  color = mix(vec3(0.5), color, 0.62 + uContrast * 0.56);
  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
