import type { EffectDefinition } from "../types";
import { clamp, colorsToFloatArray, sanitizePalette } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec3Array } from "../runtime/webgl";
import { GLSL_COMMON, MAX_SHARED_PALETTE_COLORS } from "./sharedShaderUtils";

export type LavaLampParams = {
  palette: string[];
  blobCount: number;
  blobSize: number;
  softness: number;
  speed: number;
  glow: number;
  contrast: number;
};

const DEFAULT_PARAMS: LavaLampParams = {
  palette: ["#ff7d66", "#ffa94d", "#fce38a"],
  blobCount: 5,
  blobSize: 0.42,
  softness: 0.3,
  speed: 0.22,
  glow: 0.18,
  contrast: 0.4
};

export const lavaLampDefinition: EffectDefinition<LavaLampParams> = {
  effectId: "lava-lamp",
  displayName: "Lava Lamp",
  summary: "Animated metaball blobs with palette mapping, soft unions, and glow.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "transparent",
  controls: [
    {
      kind: "palette",
      name: "palette",
      label: "Palette",
      minLength: 2,
      maxLength: 5
    },
    { kind: "range", name: "blobCount", label: "Blob Count", min: 2, max: 12, step: 1 },
    { kind: "range", name: "blobSize", label: "Blob Size", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "softness", label: "Softness", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "speed", label: "Speed", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "glow", label: "Glow", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uBlobCount",
    "uBlobSize",
    "uSoftness",
    "uSpeed",
    "uGlow",
    "uContrast",
    "uPaletteCount",
    "uPalette[0]"
  ],
  sanitizeParams(params) {
    return {
      palette: sanitizePalette(params?.palette, DEFAULT_PARAMS.palette, 2, 5),
      blobCount: clamp(Math.round(Number(params?.blobCount ?? DEFAULT_PARAMS.blobCount)), 2, 12),
      blobSize: clamp(Number(params?.blobSize ?? DEFAULT_PARAMS.blobSize), 0, 1),
      softness: clamp(Number(params?.softness ?? DEFAULT_PARAMS.softness), 0, 1),
      speed: clamp(Number(params?.speed ?? DEFAULT_PARAMS.speed), 0, 1),
      glow: clamp(Number(params?.glow ?? DEFAULT_PARAMS.glow), 0, 1),
      contrast: clamp(Number(params?.contrast ?? DEFAULT_PARAMS.contrast), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const palette = Array.isArray(params.palette) && params.palette.length > 0 ? params.palette : DEFAULT_PARAMS.palette;

    setUniformFloat(gl, locations.uBlobCount, params.blobCount);
    setUniformFloat(gl, locations.uBlobSize, params.blobSize);
    setUniformFloat(gl, locations.uSoftness, params.softness);
    setUniformFloat(gl, locations.uSpeed, params.speed);
    setUniformFloat(gl, locations.uGlow, params.glow);
    setUniformFloat(gl, locations.uContrast, params.contrast);
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
uniform float uBlobCount;
uniform float uBlobSize;
uniform float uSoftness;
uniform float uSpeed;
uniform float uGlow;
uniform float uContrast;
uniform int uPaletteCount;
uniform vec3 uPalette[${MAX_SHARED_PALETTE_COLORS}];

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
  float speed = mix(0.04, 0.28, uSpeed);
  float baseRadius = mix(0.16, 0.38, uBlobSize);
  float field = 0.0;
  float colorField = 0.0;

  for (int index = 0; index < 12; index += 1) {
    if (float(index) >= uBlobCount) {
      continue;
    }

    float fi = float(index);
    float angle = hash11(fi * 1.73 + uSeed * 19.0) * PI * 2.0 + uTime * speed * (0.65 + hash11(fi + 3.0));
    float orbit = 0.18 + hash11(fi * 4.1 + 1.7) * 0.36;
    vec2 center = vec2(cos(angle), sin(angle)) * orbit;
    center += vec2(
      sin(uTime * speed * (1.4 + fi * 0.11) + fi),
      cos(uTime * speed * (1.1 + fi * 0.09) + fi * 1.3)
    ) * 0.08;
    float radius = baseRadius * (0.7 + hash11(fi * 8.1 + 4.2) * 0.65);
    float distanceToBlob = length(uv - center);
    float contribution = radius * radius / max(distanceToBlob * distanceToBlob, 0.001);
    field += contribution;
    colorField += contribution * fi / max(uBlobCount - 1.0, 1.0);
  }

  float threshold = mix(1.8, 0.85, uSoftness);
  float softness = 0.2 + uSoftness * 0.7;
  float surface = smoothstep(threshold - softness, threshold + softness, field);
  float rim = exp(-abs(field - threshold) / max(0.06 + uGlow * 0.2, 0.001));
  vec3 color = paletteAt(saturate(colorField / max(field, 0.001)));
  color = mix(color * 0.74, color * (1.06 + uContrast * 0.4), surface);
  color += rim * (0.08 + uGlow * 0.28);
  float alpha = saturate(surface + rim * (0.16 + uGlow * 0.24));

  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
};
