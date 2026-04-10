import type { ParameterControl, UniformContext } from "../types";
import { clamp, hexToRgb, sanitizeHexColor } from "../runtime/utils";
import { setUniformFloat, setUniformVec3 } from "../runtime/webgl";

export type BorderCoreParams = {
  thicknessPx: number;
  cornerRadiusPx: number;
  insetPx: number;
  tint: string;
  glowStrength: number;
  glowSpread: number;
};

export function createBorderCoreControls<TParams extends BorderCoreParams>(): ParameterControl<TParams>[] {
  return [
    {
      kind: "range",
      name: "thicknessPx",
      label: "Thickness",
      min: 0,
      max: 64,
      step: 1,
      description: "Visible border thickness in CSS pixels."
    },
    {
      kind: "range",
      name: "cornerRadiusPx",
      label: "Corner Radius",
      min: 0,
      max: 120,
      step: 1,
      description: "Rounded-rectangle radius in CSS pixels."
    },
    {
      kind: "range",
      name: "insetPx",
      label: "Inset",
      min: -32,
      max: 32,
      step: 1,
      description: "Moves the frame inward or outward relative to the canvas edge."
    },
    {
      kind: "color",
      name: "tint",
      label: "Tint",
      description: "Primary frame color."
    },
    {
      kind: "range",
      name: "glowStrength",
      label: "Glow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Outer halo intensity."
    },
    {
      kind: "range",
      name: "glowSpread",
      label: "Glow Spread",
      min: 0,
      max: 1,
      step: 0.01,
      description: "How far the frame halo expands away from the border."
    }
  ] as ParameterControl<TParams>[];
}

export const BORDER_CORE_UNIFORM_NAMES = [
  "uThicknessPx",
  "uCornerRadiusPx",
  "uInsetPx",
  "uTint",
  "uGlowStrength",
  "uGlowSpread"
] as const;

export function sanitizeBorderCoreParams<TParams extends Partial<BorderCoreParams>>(
  params: TParams | undefined,
  defaults: BorderCoreParams
): BorderCoreParams {
  return {
    thicknessPx: clamp(Number(params?.thicknessPx ?? defaults.thicknessPx), 0, 64),
    cornerRadiusPx: clamp(Number(params?.cornerRadiusPx ?? defaults.cornerRadiusPx), 0, 120),
    insetPx: clamp(Number(params?.insetPx ?? defaults.insetPx), -32, 32),
    tint: sanitizeHexColor(params?.tint, defaults.tint),
    glowStrength: clamp(Number(params?.glowStrength ?? defaults.glowStrength), 0, 1),
    glowSpread: clamp(Number(params?.glowSpread ?? defaults.glowSpread), 0, 1)
  };
}

export function applyBorderCoreUniforms<TParams extends BorderCoreParams>({
  gl,
  locations,
  params
}: UniformContext<TParams>) {
  const [r, g, b] = hexToRgb(params.tint);
  setUniformFloat(gl, locations.uThicknessPx, params.thicknessPx);
  setUniformFloat(gl, locations.uCornerRadiusPx, params.cornerRadiusPx);
  setUniformFloat(gl, locations.uInsetPx, params.insetPx);
  setUniformFloat(gl, locations.uGlowStrength, params.glowStrength);
  setUniformFloat(gl, locations.uGlowSpread, params.glowSpread);
  setUniformVec3(gl, locations.uTint, r, g, b);
}

export const BORDER_SHADER_UTILS = `
const float PI = 3.141592653589793;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

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

vec2 fbmVec2(vec2 p) {
  return vec2(
    fbm(p + vec2(7.2, 1.3)),
    fbm(p + vec2(-3.4, 9.1))
  );
}

float sdRoundedRect(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - (halfSize - vec2(radius));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float aaWidth(float sdf) {
  return max(0.85, fwidth(sdf));
}

float rangeMask(float value, float startPx, float endPx, float featherPx) {
  return smoothstep(startPx - featherPx, startPx + featherPx, value) *
    (1.0 - smoothstep(endPx - featherPx, endPx + featherPx, value));
}

float bandMask(float sdf, float thicknessPx, float featherPx) {
  return 1.0 - smoothstep(thicknessPx - featherPx, thicknessPx + featherPx, abs(sdf));
}

float insideShellMask(float sdf, float startPx, float endPx, float featherPx) {
  return rangeMask(-sdf, startPx, endPx, featherPx);
}

float outsideShellMask(float sdf, float startPx, float endPx, float featherPx) {
  return rangeMask(sdf, startPx, endPx, featherPx);
}

float glowFalloff(float sdf, float spreadPx) {
  return exp(-max(sdf, 0.0) / max(spreadPx, 0.001));
}

vec2 roundedRectBoundaryPoint(vec2 p, vec2 halfSize, float radius) {
  vec2 flatHalf = max(halfSize - vec2(radius), vec2(0.0));
  vec2 cornerCenter = clamp(p, -flatHalf, flatHalf);
  vec2 offset = p - cornerCenter;
  float offsetLength = length(offset);

  if (offsetLength < 1e-4) {
    vec2 distances = halfSize - abs(p);

    if (distances.x < distances.y) {
      return vec2(sign(p.x == 0.0 ? 1.0 : p.x) * halfSize.x, p.y);
    }

    return vec2(p.x, sign(p.y == 0.0 ? 1.0 : p.y) * halfSize.y);
  }

  return cornerCenter + offset / offsetLength * radius;
}

float roundedRectPerimeter(vec2 halfSize, float radius) {
  vec2 flatHalf = max(halfSize - vec2(radius), vec2(0.0));
  return 4.0 * (flatHalf.x + flatHalf.y) + 2.0 * PI * radius;
}

float roundedRectPerimeterCoord(vec2 boundary, vec2 halfSize, float radius) {
  vec2 flatHalf = max(halfSize - vec2(radius), vec2(0.0));
  float top = 2.0 * flatHalf.x;
  float arc = 0.5 * PI * radius;
  float right = 2.0 * flatHalf.y;
  float bottom = top;
  float left = right;
  float eps = 0.001;

  if (boundary.y >= flatHalf.y && abs(boundary.x) <= flatHalf.x + eps) {
    return boundary.x + flatHalf.x;
  }

  if (boundary.x > flatHalf.x && boundary.y > flatHalf.y) {
    vec2 v = boundary - flatHalf;
    return top + atan(v.x, v.y) * radius;
  }

  if (boundary.x >= flatHalf.x && abs(boundary.y) <= flatHalf.y + eps) {
    return top + arc + (flatHalf.y - boundary.y);
  }

  if (boundary.x > flatHalf.x && boundary.y < -flatHalf.y) {
    vec2 v = boundary - vec2(flatHalf.x, -flatHalf.y);
    return top + arc + right + atan(-v.y, v.x) * radius;
  }

  if (boundary.y <= -flatHalf.y && abs(boundary.x) <= flatHalf.x + eps) {
    return top + arc + right + arc + (flatHalf.x - boundary.x);
  }

  if (boundary.x < -flatHalf.x && boundary.y < -flatHalf.y) {
    vec2 v = boundary - vec2(-flatHalf.x, -flatHalf.y);
    return top + arc + right + arc + bottom + atan(-v.x, -v.y) * radius;
  }

  if (boundary.x <= -flatHalf.x && abs(boundary.y) <= flatHalf.y + eps) {
    return top + arc + right + arc + bottom + arc + (boundary.y + flatHalf.y);
  }

  vec2 v = boundary - vec2(-flatHalf.x, flatHalf.y);
  return top + arc + right + arc + bottom + arc + left + atan(v.y, -v.x) * radius;
}

float cornerWeight(vec2 boundary, vec2 halfSize, float radius) {
  vec2 flatHalf = max(halfSize - vec2(radius), vec2(0.0));
  vec2 local = abs(boundary);
  float xEdge = smoothstep(flatHalf.x - max(radius * 0.7, 4.0), flatHalf.x + max(radius * 0.12, 2.0), local.x);
  float yEdge = smoothstep(flatHalf.y - max(radius * 0.7, 4.0), flatHalf.y + max(radius * 0.12, 2.0), local.y);
  return xEdge * yEdge;
}
`;
