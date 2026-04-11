import type { EffectDefinition } from "../types";
import { clamp, hexToRgb, sanitizeCssColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";
import { GLSL_COMMON } from "./sharedShaderUtils";

export type ContoursParams = {
  terrainScale: number;
  contourSpacing: number;
  lineWidth: number;
  majorEvery: number;
  drift: number;
  lineColor: string;
  backgroundColor: string;
};

const DEFAULT_PARAMS: ContoursParams = {
  terrainScale: 0.45,
  contourSpacing: 0.35,
  lineWidth: 0.2,
  majorEvery: 5,
  drift: 0.08,
  lineColor: "#1d2a35",
  backgroundColor: "#ece7dc"
};

export const contoursDefinition: EffectDefinition<ContoursParams> = {
  effectId: "contours",
  displayName: "Contours",
  summary: "Topographic contour lines built from a broad pseudo-terrain field.",
  defaults: DEFAULT_PARAMS,
  assetSlots: [],
  alphaMode: "opaque",
  controls: [
    {
      kind: "range",
      name: "terrainScale",
      label: "Terrain Scale",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "contourSpacing",
      label: "Contour Spacing",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "lineWidth",
      label: "Line Width",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "range",
      name: "majorEvery",
      label: "Major Every",
      min: 2,
      max: 10,
      step: 1
    },
    {
      kind: "range",
      name: "drift",
      label: "Drift",
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      kind: "color",
      name: "lineColor",
      label: "Line Color"
    },
    {
      kind: "color",
      name: "backgroundColor",
      label: "Background Color"
    }
  ],
  uniformNames: [
    "uTerrainScale",
    "uContourSpacing",
    "uLineWidth",
    "uMajorEvery",
    "uDrift",
    "uLineColor",
    "uBackgroundColor"
  ],
  sanitizeParams(params) {
    return {
      terrainScale: clamp(Number(params?.terrainScale ?? DEFAULT_PARAMS.terrainScale), 0, 1),
      contourSpacing: clamp(Number(params?.contourSpacing ?? DEFAULT_PARAMS.contourSpacing), 0, 1),
      lineWidth: clamp(Number(params?.lineWidth ?? DEFAULT_PARAMS.lineWidth), 0, 1),
      majorEvery: clamp(Math.round(Number(params?.majorEvery ?? DEFAULT_PARAMS.majorEvery)), 2, 10),
      drift: clamp(Number(params?.drift ?? DEFAULT_PARAMS.drift), 0, 1),
      lineColor: sanitizeCssColor(params?.lineColor, DEFAULT_PARAMS.lineColor),
      backgroundColor: sanitizeCssColor(params?.backgroundColor, DEFAULT_PARAMS.backgroundColor)
    };
  },
  applyUniforms({ gl, locations, params }) {
    const [lineR, lineG, lineB] = hexToRgb(params.lineColor);
    const [backgroundR, backgroundG, backgroundB] = hexToRgb(params.backgroundColor);

    setUniformFloat(gl, locations.uTerrainScale, params.terrainScale);
    setUniformFloat(gl, locations.uContourSpacing, params.contourSpacing);
    setUniformFloat(gl, locations.uLineWidth, params.lineWidth);
    setUniformFloat(gl, locations.uMajorEvery, params.majorEvery);
    setUniformFloat(gl, locations.uDrift, params.drift);
    setUniformVec3(gl, locations.uLineColor, lineR, lineG, lineB);
    setUniformVec3(gl, locations.uBackgroundColor, backgroundR, backgroundG, backgroundB);
  },
  fragmentShader: `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uTerrainScale;
uniform float uContourSpacing;
uniform float uLineWidth;
uniform float uMajorEvery;
uniform float uDrift;
uniform vec3 uLineColor;
uniform vec3 uBackgroundColor;

${GLSL_COMMON}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float scale = mix(0.75, 3.2, uTerrainScale);
  float drift = uTime * mix(0.0, 0.18, uDrift);
  vec2 seedOffset = vec2(cos(uSeed * 6.28318), sin(uSeed * 6.28318)) * 4.0;
  vec2 fieldUv = uv * scale + seedOffset;
  fieldUv += (fbmVec2(fieldUv * 0.7 + drift) - 0.5) * 0.85;

  float terrain = fbm(fieldUv * 0.8 + vec2(0.0, drift));
  terrain += fbm(fieldUv * 1.65 - vec2(drift * 0.4, -drift * 0.3)) * 0.35;
  terrain += dot(uv, vec2(0.12, -0.08));

  float spacing = mix(5.0, 22.0, uContourSpacing);
  float contourLevel = terrain * spacing;
  float linePhase = abs(fract(contourLevel) - 0.5);
  float feather = fwidth(contourLevel) * 0.85 + 0.001;
  float width = mix(0.12, 0.01, uLineWidth);
  float lineMask = 1.0 - smoothstep(width, width + feather, linePhase);

  float levelIndex = floor(contourLevel + 0.5);
  float majorMask = 1.0 - step(0.001, abs(mod(levelIndex, uMajorEvery)));
  float emphasis = mix(1.0, 1.85, majorMask);
  lineMask = saturate(lineMask * emphasis);

  float paper = fbm(uv * 10.0 + uSeed * 12.0);
  vec3 background = mix(uBackgroundColor * 0.94, uBackgroundColor * 1.04, paper);
  vec3 color = mix(background, uLineColor, lineMask);

  outColor = vec4(color, 1.0);
}
`
};
