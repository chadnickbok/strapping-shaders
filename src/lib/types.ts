import type { CSSProperties } from "react";

export type EffectId = "aurora-field" | "liquid-distortion" | "ghost-frame" | "pulse-trace-border";

export type Quality = "auto" | "high" | "medium" | "low";

export type EffectSeed = number | string;

export type AssetBindings = Record<string, string>;

export type EffectComponentProps<TParams extends Record<string, unknown>> = {
  width: number;
  height: number;
  params?: Partial<TParams>;
  seed?: EffectSeed;
  animate?: boolean;
  time?: number;
  assets?: AssetBindings;
  quality?: Quality;
  className?: string;
  style?: CSSProperties;
};

export type AssetSlot = {
  name: string;
  label: string;
  required: boolean;
  accept: "image";
};

export type RangeControl<TParams extends Record<string, unknown>> = {
  kind: "range";
  name: Extract<keyof TParams, string>;
  label: string;
  min: number;
  max: number;
  step: number;
  description?: string;
};

export type ColorControl<TParams extends Record<string, unknown>> = {
  kind: "color";
  name: Extract<keyof TParams, string>;
  label: string;
  description?: string;
};

export type PaletteControl<TParams extends Record<string, unknown>> = {
  kind: "palette";
  name: Extract<keyof TParams, string>;
  label: string;
  minLength: number;
  maxLength: number;
  description?: string;
};

export type ParameterControl<TParams extends Record<string, unknown>> =
  | RangeControl<TParams>
  | ColorControl<TParams>
  | PaletteControl<TParams>;

export type TextureResource = {
  texture: WebGLTexture;
  width: number;
  height: number;
  unit: number;
  src: string;
};

export type UniformContext<TParams extends Record<string, unknown>> = {
  gl: WebGL2RenderingContext;
  locations: Record<string, WebGLUniformLocation | null>;
  params: TParams;
  resolution: [number, number];
  time: number;
  seed: number;
  qualityScale: number;
  textures: Record<string, TextureResource>;
};

export type EffectDefinition<TParams extends Record<string, unknown>> = {
  effectId: EffectId;
  displayName: string;
  summary: string;
  defaults: TParams;
  controls: ParameterControl<TParams>[];
  assetSlots: AssetSlot[];
  alphaMode: "opaque" | "transparent";
  fragmentShader: string;
  uniformNames: string[];
  sanitizeParams: (params?: Partial<TParams>) => TParams;
  applyUniforms: (context: UniformContext<TParams>) => void;
};

export type AnyEffectDefinition = EffectDefinition<any>;

export type ShaderNodePayload = {
  id: string;
  type: "shader";
  effectId: EffectId;
  frame: {
    width: number;
    height: number;
    rotation?: number;
  };
  params: Record<string, unknown>;
  seed?: EffectSeed;
  assets?: AssetBindings;
  exportOverrides?: {
    quality?: Quality;
    animate?: boolean;
    time?: number;
  };
};

export type EffectPreset = {
  name: string;
  effectId: EffectId;
  description?: string;
  tags?: string[];
  params: Record<string, unknown>;
};
