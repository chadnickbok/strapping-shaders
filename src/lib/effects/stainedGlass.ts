import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformInt, setUniformVec2, setUniformVec3 } from "../runtime/webgl";
import {
  GLSL_COMMON,
  GLSL_IMAGE_UTILS,
  REQUIRED_IMAGE_ASSET_SLOT
} from "./sharedShaderUtils";

export type StainedGlassParams = {
  cellSize: number;
  leadWidth: number;
  irregularity: number;
  colorSnap: number;
  bevel: number;
  leadColor: string;
  opacity: number;
};

const DEFAULT_PARAMS: StainedGlassParams = {
  cellSize: 0.35,
  leadWidth: 0.16,
  irregularity: 0.22,
  colorSnap: 0.28,
  bevel: 0.2,
  leadColor: "#2b241c",
  opacity: 1
};

export const stainedGlassDefinition: EffectDefinition<StainedGlassParams> = {
  effectId: "stained-glass",
  displayName: "Stained Glass",
  summary: "Voronoi-pane mosaic with lead lines, color flattening, and bevel lighting.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [REQUIRED_IMAGE_ASSET_SLOT],
  alphaMode: "opaque",
  controls: [
    { kind: "range", name: "cellSize", label: "Cell Size", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "leadWidth", label: "Lead Width", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "irregularity", label: "Irregularity", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "colorSnap", label: "Color Snap", min: 0, max: 1, step: 0.01 },
    { kind: "range", name: "bevel", label: "Bevel", min: 0, max: 1, step: 0.01 },
    { kind: "color", name: "leadColor", label: "Lead Color" },
    { kind: "range", name: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 }
  ],
  uniformNames: [
    "uCellSize",
    "uLeadWidth",
    "uIrregularity",
    "uColorSnap",
    "uBevel",
    "uLeadColor",
    "uOpacity",
    "uSourceImage",
    "uImageResolution"
  ],
  sanitizeParams(params) {
    return {
      cellSize: clamp(Number(params?.cellSize ?? DEFAULT_PARAMS.cellSize), 0, 1),
      leadWidth: clamp(Number(params?.leadWidth ?? DEFAULT_PARAMS.leadWidth), 0, 1),
      irregularity: clamp(Number(params?.irregularity ?? DEFAULT_PARAMS.irregularity), 0, 1),
      colorSnap: clamp(Number(params?.colorSnap ?? DEFAULT_PARAMS.colorSnap), 0, 1),
      bevel: clamp(Number(params?.bevel ?? DEFAULT_PARAMS.bevel), 0, 1),
      leadColor: sanitizeCssColor(params?.leadColor, DEFAULT_PARAMS.leadColor),
      opacity: clamp(Number(params?.opacity ?? DEFAULT_PARAMS.opacity), 0, 1)
    };
  },
  applyUniforms({ gl, locations, params, textures }) {
    const texture = textures.sourceImage;

    if (!texture) {
      return;
    }

    const [r, g, b] = hexToRgb(params.leadColor);

    setUniformFloat(gl, locations.uCellSize, params.cellSize);
    setUniformFloat(gl, locations.uLeadWidth, params.leadWidth);
    setUniformFloat(gl, locations.uIrregularity, params.irregularity);
    setUniformFloat(gl, locations.uColorSnap, params.colorSnap);
    setUniformFloat(gl, locations.uBevel, params.bevel);
    setUniformVec3(gl, locations.uLeadColor, r, g, b);
    setUniformFloat(gl, locations.uOpacity, params.opacity);
    setUniformInt(gl, locations.uSourceImage, texture.unit);
    setUniformVec2(gl, locations.uImageResolution, texture.width, texture.height);
  },
  fragmentShader: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uSeed;
uniform float uCellSize;
uniform float uLeadWidth;
uniform float uIrregularity;
uniform float uColorSnap;
uniform float uBevel;
uniform vec3 uLeadColor;
uniform float uOpacity;
uniform sampler2D uSourceImage;

${GLSL_COMMON}
${GLSL_IMAGE_UTILS}

void cellInfo(vec2 p, out vec2 nearestPoint, out float nearest, out float secondNearest) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  nearest = 8.0;
  secondNearest = 8.0;
  nearestPoint = vec2(0.0);

  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = hash22(cell + offset + uSeed * 19.0);
      point = mix(vec2(0.5), point, 0.35 + uIrregularity * 0.7);
      vec2 diff = offset + point - local;
      float distanceSquared = dot(diff, diff);

      if (distanceSquared < nearest) {
        secondNearest = nearest;
        nearest = distanceSquared;
        nearestPoint = cell + offset + point;
      } else if (distanceSquared < secondNearest) {
        secondNearest = distanceSquared;
      }
    }
  }
}

void main() {
  vec2 uv = vUv;
  float density = mix(4.0, 14.0, 1.0 - uCellSize);
  vec2 fieldUv = uv * density;
  vec2 nearestPoint;
  float nearest;
  float secondNearest;
  cellInfo(fieldUv, nearestPoint, nearest, secondNearest);
  float edge = sqrt(max(secondNearest, 0.0)) - sqrt(max(nearest, 0.0));
  vec2 sampleUv = nearestPoint / density;
  vec2 imageUv = coverUv(sampleUv, uImageResolution, uResolution);
  vec3 paneColor = sampleClamped(uSourceImage, imageUv).rgb;
  vec3 snapped = floor(paneColor * (3.0 + uColorSnap * 6.0)) / (3.0 + uColorSnap * 6.0);
  paneColor = mix(paneColor, snapped, uColorSnap);

  float lead = 1.0 - smoothstep(0.0, 0.015 + uLeadWidth * 0.1, edge);
  float bevel = smoothstep(0.0, 0.14, edge) * (1.0 - lead) * uBevel;
  vec3 color = mix(paneColor * (0.82 + bevel * 0.4), uLeadColor, lead);

  outColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`
};
