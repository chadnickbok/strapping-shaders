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

export function hexToRgb(value: string): [number, number, number] {
  const normalized = value.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return [1, 1, 1];
  }

  const numeric = Number.parseInt(expanded, 16);

  return [
    ((numeric >> 16) & 255) / 255,
    ((numeric >> 8) & 255) / 255,
    (numeric & 255) / 255
  ];
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
