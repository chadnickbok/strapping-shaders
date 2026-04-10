import type {
  AnyEffectDefinition,
  AssetBindings,
  EffectId,
  EffectPreset,
  Quality,
  ShaderNodePayload
} from "../types";

export type PlaygroundEffectState = {
  nodeId: string;
  effectId: EffectId;
  width: number;
  height: number;
  params: Record<string, unknown>;
  seedInput: string;
  animate: boolean;
  manualTime: boolean;
  time: number;
  quality: Quality;
  assets: AssetBindings;
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createPlaygroundState(node: ShaderNodePayload): PlaygroundEffectState {
  return {
    nodeId: node.id,
    effectId: node.effectId,
    width: node.frame.width,
    height: node.frame.height,
    params: cloneValue(node.params),
    seedInput: node.seed === undefined ? "" : String(node.seed),
    animate: node.exportOverrides?.animate ?? true,
    manualTime: false,
    time: node.exportOverrides?.time ?? 0,
    quality: node.exportOverrides?.quality ?? "auto",
    assets: cloneValue(node.assets ?? {})
  };
}

export function coerceSeedInput(seedInput: string) {
  const trimmed = seedInput.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

export function buildShaderNodeFromState(state: PlaygroundEffectState): ShaderNodePayload {
  const seed = coerceSeedInput(state.seedInput);
  const node: ShaderNodePayload = {
    id: state.nodeId,
    type: "shader",
    effectId: state.effectId,
    frame: {
      width: state.width,
      height: state.height
    },
    params: cloneValue(state.params),
    exportOverrides: {
      quality: state.quality,
      animate: state.animate
    }
  };

  if (seed !== undefined) {
    node.seed = seed;
  }

  if (state.manualTime) {
    node.exportOverrides = {
      ...node.exportOverrides,
      time: state.time
    };
  }

  if (Object.keys(state.assets).length > 0) {
    node.assets = cloneValue(state.assets);
  }

  return node;
}

export function applyPresetToState(
  state: PlaygroundEffectState,
  preset: EffectPreset,
  definition: AnyEffectDefinition
) {
  return {
    ...state,
    params: definition.sanitizeParams(cloneValue(preset.params)) as Record<string, unknown>
  };
}
