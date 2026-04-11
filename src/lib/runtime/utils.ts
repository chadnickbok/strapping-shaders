import type { EffectSeed, Quality } from "../types";

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function normalizeSeed(seed?: EffectSeed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const normalized = Math.abs(seed % 104729) / 104729;
    return normalized === 0 ? 0.5 : normalized;
  }

  const text = String(seed ?? "canvas-shaders-default");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

export function qualityToScale(quality: Quality, width: number, height: number) {
  if (quality === "high") {
    return 1;
  }

  if (quality === "medium") {
    return 0.82;
  }

  if (quality === "low") {
    return 0.64;
  }

  const area = width * height;

  if (area > 1_400_000) {
    return 0.72;
  }

  if (area > 700_000) {
    return 0.84;
  }

  return 1;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function splitFunctionArgs(source: string) {
  return source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseHexColor(value: string): [number, number, number, number] | null {
  const normalized = value.trim().replace("#", "");
  const expanded =
    normalized.length === 3 || normalized.length === 4
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(expanded)) {
    return null;
  }

  const numeric = Number.parseInt(expanded, 16);

  if (expanded.length === 8) {
    return [
      ((numeric >> 24) & 255) / 255,
      ((numeric >> 16) & 255) / 255,
      ((numeric >> 8) & 255) / 255,
      (numeric & 255) / 255
    ];
  }

  return [
    ((numeric >> 16) & 255) / 255,
    ((numeric >> 8) & 255) / 255,
    (numeric & 255) / 255,
    1
  ];
}

function parseRgbChannel(value: string) {
  if (value.endsWith("%")) {
    const percentage = Number.parseFloat(value.slice(0, -1));

    if (!Number.isFinite(percentage)) {
      return null;
    }

    return clamp01(percentage / 100);
  }

  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return clamp01(numeric / 255);
}

function parseAlphaChannel(value: string) {
  if (value.endsWith("%")) {
    const percentage = Number.parseFloat(value.slice(0, -1));

    if (!Number.isFinite(percentage)) {
      return null;
    }

    return clamp01(percentage / 100);
  }

  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return clamp01(numeric);
}

function parseRgbFunction(value: string): [number, number, number, number] | null {
  const match = value
    .trim()
    .match(/^rgba?\((.+)\)$/i);

  if (!match) {
    return null;
  }

  const parts = splitFunctionArgs(match[1]);

  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const red = parseRgbChannel(parts[0]);
  const green = parseRgbChannel(parts[1]);
  const blue = parseRgbChannel(parts[2]);
  const alpha = parts[3] ? parseAlphaChannel(parts[3]) : 1;

  if (red === null || green === null || blue === null || alpha === null) {
    return null;
  }

  return [red, green, blue, alpha];
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t;

  if (value < 0) {
    value += 1;
  }

  if (value > 1) {
    value -= 1;
  }

  if (value < 1 / 6) {
    return p + (q - p) * 6 * value;
  }

  if (value < 1 / 2) {
    return q;
  }

  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6;
  }

  return p;
}

function parsePercentage(value: string) {
  const numeric = Number.parseFloat(value.replace("%", ""));

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return clamp01(numeric / 100);
}

function parseHueDegrees(value: string) {
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return ((numeric % 360) + 360) % 360;
}

function parseHslFunction(value: string): [number, number, number, number] | null {
  const match = value
    .trim()
    .match(/^hsla?\((.+)\)$/i);

  if (!match) {
    return null;
  }

  const parts = splitFunctionArgs(match[1]);

  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const hue = parseHueDegrees(parts[0]);
  const saturation = parsePercentage(parts[1]);
  const lightness = parsePercentage(parts[2]);
  const alpha = parts[3] ? parseAlphaChannel(parts[3]) : 1;

  if (hue === null || saturation === null || lightness === null || alpha === null) {
    return null;
  }

  const h = hue / 360;

  if (saturation === 0) {
    return [lightness, lightness, lightness, alpha];
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    hueToRgb(p, q, h + 1 / 3),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1 / 3),
    alpha
  ];
}

export function cssColorToRgba(value: string): [number, number, number, number] | null {
  return parseHexColor(value) ?? parseRgbFunction(value) ?? parseHslFunction(value);
}

export function hexToRgb(value: string): [number, number, number] {
  const parsed = cssColorToRgba(value);

  return parsed ? [parsed[0], parsed[1], parsed[2]] : [1, 1, 1];
}

export function cssColorToHex(value: string, fallback = "#ffffff") {
  const parsed = cssColorToRgba(value);

  if (!parsed) {
    return fallback;
  }

  const [red, green, blue] = parsed;

  return `#${[red, green, blue]
    .map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function colorsToFloatArray(colors: string[], maxLength: number, fallback: string) {
  const entries = colors.length > 0 ? colors : [fallback];
  const resolved = new Float32Array(maxLength * 3);

  for (let index = 0; index < maxLength; index += 1) {
    const color = entries[Math.min(index, entries.length - 1)] ?? fallback;
    const [r, g, b] = hexToRgb(color);
    resolved[index * 3] = r;
    resolved[index * 3 + 1] = g;
    resolved[index * 3 + 2] = b;
  }

  return resolved;
}

export function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

export function sanitizeCssColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return cssColorToRgba(trimmed) ? trimmed : fallback;
}

export function sanitizePalette(value: unknown, fallback: string[], minLength: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const palette = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry, index) => sanitizeHexColor(entry, fallback[index] ?? fallback[fallback.length - 1]))
    .slice(0, maxLength);

  if (palette.length < minLength) {
    return [...fallback];
  }

  return palette;
}

export function assetSignature(assets: Record<string, string>) {
  return Object.entries(assets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([slot, src]) => `${slot}:${src}`)
    .join("|");
}

export function paramsSignature(params: Record<string, unknown>) {
  return JSON.stringify(params);
}
