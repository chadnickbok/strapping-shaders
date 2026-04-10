import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { ShaderRenderer } from "../lib";
import { getEffectDefinition } from "../lib/registry";
import { defaultNodes, presetsByEffect, resolveAssetSource } from "../lib/playground/examples";
import {
  applyPresetToState,
  buildShaderNodeFromState,
  createPlaygroundState,
  type PlaygroundEffectState
} from "../lib/playground/state";
import type {
  AnyEffectDefinition,
  EffectId,
  ParameterControl,
  Quality
} from "../lib/types";
import { hexToRgb } from "../lib/runtime/utils";

const QUALITY_OPTIONS: Quality[] = ["auto", "high", "medium", "low"];
const repositoryBaseUrl = ((import.meta.env.VITE_REPOSITORY_URL as string | undefined) ?? "")
  .trim()
  .replace(/\/$/, "");

type ViewMode = "preview" | "payload";
type PlaygroundEffectId = Exclude<EffectId, "button-ghost-whoosh" | "ghost-whoosh-button" | "pulse-trace-border">;
type BurstEffectId = "ghost-frame" | "button-emitter-aura";
type ButtonPreviewEffectId = "button-emitter-aura";

const PLAYGROUND_EFFECT_IDS = [
  "aurora-field",
  "caustic-pool",
  "voronoi-caustics",
  "liquid-distortion",
  "ghost-frame",
  "button-emitter-aura"
] as const satisfies readonly PlaygroundEffectId[];

const BURST_EFFECT_IDS = ["ghost-frame", "button-emitter-aura"] as const;

type EffectPresentation = {
  listDescription: string;
  toolbarDescription: string;
  previewHint: string;
  previewUseCase: string;
  notes: string;
  support: string[];
  sourcePath: string;
};

type PreviewChrome = {
  showcasePadding: number;
  frameShellClassName?: string;
  innerClassName?: string;
  showcaseShellClassName?: string;
  overlay?: {
    className: string;
    eyebrow: string;
    title: string;
    body: string;
  };
  interactionLabel?: string;
};

const BUTTON_EMITTER_GEOMETRY_KEYS = [
  "buttonCenterXPx",
  "buttonCenterYPx",
  "buttonWidthPx",
  "buttonHeightPx",
  "buttonRadiusPx"
] as const;

function isBurstEffect(effectId: PlaygroundEffectId): effectId is BurstEffectId {
  return effectId === "ghost-frame" || effectId === "button-emitter-aura";
}

function isButtonPreviewEffect(effectId: PlaygroundEffectId): effectId is ButtonPreviewEffectId {
  return effectId === "button-emitter-aura";
}

function roundToPrecision(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function rgbaFromHex(value: string, alpha: number) {
  const [r, g, b] = hexToRgb(value);

  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(3)})`;
}

function resetBurstParamsForEffect(effectId: BurstEffectId, state: PlaygroundEffectState) {
  if (effectId === "ghost-frame") {
    if (state.params.burstAmount === 0) {
      return state;
    }

    return {
      ...state,
      params: {
        ...state.params,
        burstAmount: 0
      }
    };
  }

  const burstPhase = typeof state.params.burstPhase === "number" ? state.params.burstPhase : 0;

  if (state.params.burstAmount === 0 && burstPhase === 0) {
    return state;
  }

  return {
    ...state,
    params: {
      ...state.params,
      burstAmount: 0,
      burstPhase: 0
    }
  };
}

const effectPresentation: Record<PlaygroundEffectId, EffectPresentation> = {
  "aurora-field": {
    listDescription: "Layered color ribbons for atmospheric backgrounds and motion surfaces.",
    toolbarDescription: "Procedural atmospheric ribbons with palette mapping and soft motion.",
    previewHint: "Move cursor to perturb the field",
    previewUseCase: "Hero surfaces / ambient panels",
    notes:
      "A procedural color field suited to large-format backgrounds where motion should stay soft and the foreground still needs contrast.",
    support: ["WebGL2", "Opaque output", "No texture input"],
    sourcePath: "docs/aurora.md"
  },
  "caustic-pool": {
    listDescription: "Image-first pool-floor treatment with smooth water warp and clean bright caustic light.",
    toolbarDescription: "A swimming-pool floor shader that submerges an optional image beneath a calm water warp and a restrained caustic lattice.",
    previewHint: "Tune distortion, caustic, and size to balance the submerged photo against the light lattice",
    previewUseCase: "Hero backgrounds / image-backed pool treatments / water-themed panels",
    notes:
      "Caustic Pool now treats the source image as the pool floor first, then adds broad water refraction and a clean Voronoi-derived caustic overlay without procedural background noise competing with the photo.",
    support: ["WebGL2", "Opaque output", "Optional source image"],
    sourcePath: "docs/caustic-pool.md"
  },
  "voronoi-caustics": {
    listDescription: "Stylized cellular light webs with drifting Voronoi ridges and calmer water-tinted gaps.",
    toolbarDescription: "A stylized Voronoi caustic web built from warped cellular ridges, contrast shaping, and soft halo lift.",
    previewHint: "Tune scale, line width, and contrast to shape the cellular web",
    previewUseCase: "Decorative backgrounds / aquatic UI / stylized light surfaces",
    notes:
      "Voronoi Caustics keeps the original cellular ridge language but exposes it honestly as a stylized web, with separate controls for cell scale, line width, contrast, and drift.",
    support: ["WebGL2", "Opaque output", "No texture input"],
    sourcePath: "docs/voronoi-caustics.md"
  },
  "liquid-distortion": {
    listDescription: "Image-backed liquid refraction with restrained blur, motion, and glint.",
    toolbarDescription: "Animated image-backed distortion tuned for liquid-like refraction.",
    previewHint: "Use the fixture image to inspect refraction",
    previewUseCase: "Media cards / distorted image treatments",
    notes:
      "A refractive distortion treatment for photographs and other image-backed surfaces. The demo uses the bundled sample image so the blur, motion, and highlight glint remain visible.",
    support: ["WebGL2", "Transparent output", "Requires a source image"],
    sourcePath: "docs/liquid-distortion.md"
  },
  "ghost-frame": {
    listDescription: "Center-sourced vapor that catches on a rounded frame and blooms on burst.",
    toolbarDescription: "A spectral rounded frame with breathing vapor and a host-driven poof burst.",
    previewHint: "Click the card to trigger a poof burst",
    previewUseCase: "Haunted cards / ritual UI / atmospheric overlays",
    notes:
      "Ghost Frame keeps the center legible while vapor appears to leak outward from within the card and condense on the frame shell.",
    support: ["WebGL2", "Transparent output", "Best on dark or photographic backdrops"],
    sourcePath: "docs/ghost-frame.md"
  },
  "button-emitter-aura": {
    listDescription: "A button-local aura shell with ghost and fire looks built from one shared core.",
    toolbarDescription: "A rounded button emitter with authored ghost and fire presets plus host-driven burst control.",
    previewHint: "Click the button to trigger an aura burst",
    previewUseCase: "Buttons / spectral CTAs / elemental actions",
    notes:
      "Button Emitter Aura keeps the shader anchored to the measured button rectangle instead of the full host canvas, so the wisps read as emitted from the button itself.",
    support: ["WebGL2", "Transparent output", "Host passes button geometry"],
    sourcePath: "docs/button-emitter-aura.md"
  }
};

const previewChromeByEffect: Record<PlaygroundEffectId, PreviewChrome> = {
  "aurora-field": {
    showcasePadding: 0
  },
  "caustic-pool": {
    showcasePadding: 0
  },
  "voronoi-caustics": {
    showcasePadding: 0
  },
  "liquid-distortion": {
    showcasePadding: 0
  },
  "ghost-frame": {
    showcasePadding: 40,
    frameShellClassName: "preview-stage__frame-shell--ghost",
    innerClassName: "preview-stage__inner--frame-overlay",
    showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--ghost-frame",
    overlay: {
      className: "showcase-card showcase-card--ghost-frame",
      eyebrow: "UI card",
      title: "Ghost Frame",
      body: "Center-born vapor leaks into the frame, then dissipates back into the dark."
    },
    interactionLabel: "Trigger Ghost Frame burst"
  },
  "button-emitter-aura": {
    showcasePadding: 36,
    frameShellClassName: "preview-stage__frame-shell--button-emitter",
    innerClassName: "preview-stage__inner--button-emitter",
    showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--button-emitter"
  }
};

function createInitialStates() {
  return {
    "aurora-field": createPlaygroundState(defaultNodes["aurora-field"]),
    "caustic-pool": createPlaygroundState(defaultNodes["caustic-pool"]),
    "voronoi-caustics": createPlaygroundState(defaultNodes["voronoi-caustics"]),
    "liquid-distortion": createPlaygroundState(defaultNodes["liquid-distortion"]),
    "ghost-frame": createPlaygroundState(defaultNodes["ghost-frame"]),
    "button-emitter-aura": createPlaygroundState(defaultNodes["button-emitter-aura"])
  } satisfies Record<PlaygroundEffectId, PlaygroundEffectState>;
}

function computePreviewScale(
  width: number,
  height: number,
  availableWidth: number,
  availableHeight: number,
  showcasePadding: number
) {
  if (!availableWidth || !availableHeight) {
    return 1;
  }

  return Math.min(
    1,
    Math.max(availableWidth - showcasePadding * 2, 0) / width,
    Math.max(availableHeight - showcasePadding * 2, 0) / height
  );
}

function formatRangeValue(value: number, step: number) {
  return step >= 1 ? `${Math.round(value)}` : value.toFixed(2);
}

function GitHubMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="github-mark"
      fill="none"
      viewBox="0 0 98 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function App() {
  const [selectedEffectId, setSelectedEffectId] = useState<PlaygroundEffectId>("aurora-field");
  const [states, setStates] = useState<Record<PlaygroundEffectId, PlaygroundEffectState>>(createInitialStates);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [query, setQuery] = useState("");
  const [previewBounds, setPreviewBounds] = useState({ width: 0, height: 0 });
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const burstFrameRefs = useRef<Partial<Record<BurstEffectId, number>>>({});
  const buttonEmitterHostRef = useRef<HTMLDivElement>(null);
  const buttonEmitterButtonRef = useRef<HTMLButtonElement>(null);
  const definition = getEffectDefinition(selectedEffectId) as AnyEffectDefinition;
  const currentState = states[selectedEffectId];
  const presentation = effectPresentation[selectedEffectId];
  const previewChrome = previewChromeByEffect[selectedEffectId];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEffects = PLAYGROUND_EFFECT_IDS.filter((effectId) => {
    const effect = getEffectDefinition(effectId);
    const haystack = [
      effect.displayName,
      effect.summary,
      effectPresentation[effectId].listDescription
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  useEffect(() => {
    const node = previewViewportRef.current;

    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setPreviewBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      for (const frame of Object.values(burstFrameRefs.current)) {
        if (typeof frame === "number") {
          cancelAnimationFrame(frame);
        }
      }
    };
  }, []);

  useEffect(() => {
    for (const effectId of BURST_EFFECT_IDS) {
      if (selectedEffectId !== effectId) {
        stopBurstAnimation(effectId);
      }
    }

    setStates((previous) => {
      let nextState = previous;

      for (const effectId of BURST_EFFECT_IDS) {
        if (selectedEffectId === effectId) {
          continue;
        }

        const resetState = resetBurstParamsForEffect(effectId, previous[effectId]);

        if (resetState !== previous[effectId]) {
          if (nextState === previous) {
            nextState = { ...previous };
          }

          nextState[effectId] = resetState;
        }
      }

      return nextState;
    });
  }, [selectedEffectId]);

  const previewScale = computePreviewScale(
    currentState.width,
    currentState.height,
    previewBounds.width,
    previewBounds.height,
    previewChrome.showcasePadding
  );
  const previewWidth = currentState.width * previewScale;
  const previewHeight = currentState.height * previewScale;
  const previewAssets = Object.fromEntries(
    Object.entries(currentState.assets).map(([slot, src]) => [slot, resolveAssetSource(src)])
  );
  const nodePayload = buildShaderNodeFromState(currentState);
  const sourceHref = repositoryBaseUrl
    ? `${repositoryBaseUrl}/blob/main/${presentation.sourcePath}`
    : undefined;
  const previewFooterMeta = [
    "WebGL2",
    definition.alphaMode === "transparent" ? "transparent" : "opaque",
    definition.assetSlots.length > 0 ? `${definition.assetSlots.length} texture` : "procedural"
  ].join(" • ");
  const buttonEmitterTintA = typeof currentState.params.tintA === "string" ? currentState.params.tintA : "#f6fbff";
  const buttonEmitterTintB = typeof currentState.params.tintB === "string" ? currentState.params.tintB : "#cde7ff";
  const buttonEmitterWidth = typeof currentState.params.buttonWidthPx === "number" ? currentState.params.buttonWidthPx : 220;
  const buttonEmitterHeight = typeof currentState.params.buttonHeightPx === "number" ? currentState.params.buttonHeightPx : 72;
  const buttonEmitterRadius =
    typeof currentState.params.buttonRadiusPx === "number" ? currentState.params.buttonRadiusPx : 22;
  const buttonEmitterGlowStrength =
    typeof currentState.params.glowStrength === "number" ? currentState.params.glowStrength : 0.35;
  const buttonEmitterDirectionalBias =
    typeof currentState.params.directionalBias === "number" ? currentState.params.directionalBias : 0;
  const buttonEmitterDirectionY = typeof currentState.params.directionY === "number" ? currentState.params.directionY : 0;
  const buttonEmitterLooksFireLike =
    selectedEffectId === "button-emitter-aura" &&
    buttonEmitterDirectionalBias > 0.55 &&
    buttonEmitterDirectionY < -0.35;
  const buttonPreviewVariantClassName = buttonEmitterLooksFireLike
    ? "button-emitter-demo--fire"
    : "button-emitter-demo--ghost";
  const buttonPreviewButtonClassName = buttonEmitterLooksFireLike
    ? "button-emitter-demo__button--fire"
    : "button-emitter-demo__button--ghost";
  const buttonPreviewLabel = buttonEmitterLooksFireLike ? "Fire Button" : "Ghost Button";
  const buttonEmitterThemeStyle = {
    "--button-emitter-accent-soft": rgbaFromHex(
      buttonEmitterTintA,
      buttonEmitterLooksFireLike ? 0.06 + buttonEmitterGlowStrength * 0.08 : 0.05 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-accent-strong": rgbaFromHex(
      buttonEmitterTintB,
      buttonEmitterLooksFireLike ? 0.22 + buttonEmitterGlowStrength * 0.08 : 0.16 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-border": rgbaFromHex(
      buttonEmitterTintB,
      buttonEmitterLooksFireLike ? 0.26 + buttonEmitterGlowStrength * 0.08 : 0.16 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-shadow": rgbaFromHex(
      buttonEmitterTintB,
      buttonEmitterLooksFireLike ? 0.16 + buttonEmitterGlowStrength * 0.1 : 0.1 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-text": buttonEmitterLooksFireLike ? "#fff6ea" : "#f7fbff"
  } as CSSProperties;
  const buttonEmitterButtonStyle = {
    width: buttonEmitterWidth,
    height: buttonEmitterHeight,
    borderRadius: buttonEmitterRadius
  } as CSSProperties;

  useEffect(() => {
    if (!isButtonPreviewEffect(selectedEffectId) || viewMode !== "preview") {
      return undefined;
    }

    const host = buttonEmitterHostRef.current;
    const button = buttonEmitterButtonRef.current;

    if (!host || !button) {
      return undefined;
    }

    const measure = () => {
      const hostRect = host.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      if (hostRect.width <= 0 || hostRect.height <= 0 || buttonRect.width <= 0 || buttonRect.height <= 0) {
        return;
      }

      const scale = previewScale || 1;
      const borderRadius = Number.parseFloat(window.getComputedStyle(button).borderTopLeftRadius) || 0;
      const nextGeometry = {
        buttonCenterXPx: roundToPrecision((buttonRect.left - hostRect.left + buttonRect.width * 0.5) / scale),
        buttonCenterYPx: roundToPrecision((buttonRect.top - hostRect.top + buttonRect.height * 0.5) / scale),
        buttonWidthPx: roundToPrecision(buttonRect.width / scale),
        buttonHeightPx: roundToPrecision(buttonRect.height / scale),
        buttonRadiusPx: roundToPrecision(borderRadius)
      };

      setStates((previous) => {
        const currentParams = previous[selectedEffectId].params as Record<string, unknown>;
        const hasChanged = BUTTON_EMITTER_GEOMETRY_KEYS.some((key) => {
          const currentValue = Number(currentParams[key] ?? 0);
          return Math.abs(currentValue - nextGeometry[key]) > 0.01;
        });

        if (!hasChanged) {
          return previous;
        }

        return {
          ...previous,
          [selectedEffectId]: {
            ...previous[selectedEffectId],
            params: {
              ...previous[selectedEffectId].params,
              ...nextGeometry
            }
          }
        };
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(host);
    observer.observe(button);

    return () => observer.disconnect();
  }, [currentState.height, currentState.width, previewScale, selectedEffectId, viewMode]);

  function updateCurrentState(updater: (state: PlaygroundEffectState) => PlaygroundEffectState) {
    if (isBurstEffect(selectedEffectId)) {
      stopBurstAnimation(selectedEffectId);
    }

    setStates((previous) => ({
      ...previous,
      [selectedEffectId]: updater(
        isBurstEffect(selectedEffectId)
          ? resetBurstParamsForEffect(selectedEffectId, previous[selectedEffectId])
          : previous[selectedEffectId]
      )
    }));
  }

  function updateParams(nextParams: Record<string, unknown>) {
    updateCurrentState((state) => ({
      ...state,
      params: definition.sanitizeParams(nextParams) as Record<string, unknown>
    }));
  }

  function resetCurrentState() {
    if (isBurstEffect(selectedEffectId)) {
      stopBurstAnimation(selectedEffectId);
    }

    setStates((previous) => ({
      ...previous,
      [selectedEffectId]: createPlaygroundState(defaultNodes[selectedEffectId])
    }));
  }

  function requestFullscreen() {
    void previewViewportRef.current?.requestFullscreen();
  }

  function setBurstState(effectId: BurstEffectId, burstAmount: number, burstPhase = 0) {
    setStates((previous) => ({
      ...previous,
      [effectId]: {
        ...previous[effectId],
        params: {
          ...previous[effectId].params,
          burstAmount,
          ...(effectId === "ghost-frame" ? {} : { burstPhase })
        }
      }
    }));
  }

  function stopBurstAnimation(effectId: BurstEffectId) {
    const frame = burstFrameRefs.current[effectId];

    if (typeof frame === "number") {
      cancelAnimationFrame(frame);
      delete burstFrameRefs.current[effectId];
    }
  }

  function triggerBurstAnimation(effectId: BurstEffectId) {
    stopBurstAnimation(effectId);
    const durationMs = effectId === "ghost-frame" ? 900 : 650;
    const decayRate = effectId === "ghost-frame" ? 3.6 : 4.2;
    const taper = effectId === "ghost-frame" ? 0.14 : 0.08;
    const startedAt = performance.now();

    setBurstState(effectId, 1, 0);

    const tick = (timestamp: number) => {
      const elapsedMs = timestamp - startedAt;
      const progress = Math.min(elapsedMs / durationMs, 1);
      const elapsedSec = elapsedMs / 1000;
      const burstAmount = progress >= 1 ? 0 : Math.exp(-elapsedSec * decayRate) * (1 - progress * taper);

      setBurstState(effectId, Math.max(0, burstAmount), progress);

      if (progress < 1) {
        burstFrameRefs.current[effectId] = requestAnimationFrame(tick);
      } else {
        setBurstState(effectId, 0, 0);
        delete burstFrameRefs.current[effectId];
      }
    };

    burstFrameRefs.current[effectId] = requestAnimationFrame(tick);
  }

  function handleInteractivePreviewKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (selectedEffectId !== "ghost-frame") {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerBurstAnimation("ghost-frame");
    }
  }

  function renderControl(control: ParameterControl<Record<string, unknown>>) {
    const value = currentState.params[control.name];

    if (control.kind === "range") {
      const numericValue = typeof value === "number" ? value : 0;

      return (
        <label className="field" key={control.name}>
          <div className="field__header">
            <span>{control.label}</span>
            <span className="field__value">{formatRangeValue(numericValue, control.step)}</span>
          </div>
          <input
            className="field__range"
            max={control.max}
            min={control.min}
            onChange={(event) =>
              updateParams({
                ...currentState.params,
                [control.name]: Number(event.target.value)
              })
            }
            step={control.step}
            type="range"
            value={numericValue}
          />
        </label>
      );
    }

    if (control.kind === "color") {
      return (
        <label className="field field--color" key={control.name}>
          <span>{control.label}</span>
          <input
            className="field__color"
            onChange={(event) =>
              updateParams({
                ...currentState.params,
                [control.name]: event.target.value
              })
            }
            type="color"
            value={typeof value === "string" ? value : "#ffffff"}
          />
        </label>
      );
    }

    const palette = Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

    return (
      <div className="field" key={control.name}>
        <div className="field__header">
          <span>{control.label}</span>
          <span className="field__value">{palette.length} colors</span>
        </div>
        <div className="palette-editor">
          {palette.map((entry, index) => (
            <div className="palette-swatch" key={`${control.name}-${index}`}>
              <input
                className="field__color"
                onChange={(event) => {
                  const nextPalette = [...palette];
                  nextPalette[index] = event.target.value;
                  updateParams({
                    ...currentState.params,
                    [control.name]: nextPalette
                  });
                }}
                type="color"
                value={entry}
              />
              <button
                className="utility-button"
                disabled={palette.length <= control.minLength}
                onClick={() => {
                  const nextPalette = palette.filter((_, paletteIndex) => paletteIndex !== index);
                  updateParams({
                    ...currentState.params,
                    [control.name]: nextPalette
                  });
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="utility-button"
          disabled={palette.length >= control.maxLength}
          onClick={() => {
            const lastColor = palette[palette.length - 1] ?? "#ffffff";
            updateParams({
              ...currentState.params,
              [control.name]: [...palette, lastColor]
            });
          }}
          type="button"
        >
          Add color
        </button>
      </div>
    );
  }

  const shaderPreview = (
    <ShaderRenderer
      animate={currentState.animate}
      assets={previewAssets}
      className={isButtonPreviewEffect(selectedEffectId) ? "preview-renderer preview-renderer--button-emitter" : "preview-renderer"}
      effectId={selectedEffectId}
      height={currentState.height}
      params={currentState.params}
      quality={currentState.quality}
      seed={currentState.seedInput.trim() ? currentState.seedInput : undefined}
      time={currentState.manualTime ? currentState.time : undefined}
      width={currentState.width}
    />
  );

  const previewFrame = (
    <div
      className={[
        "preview-stage__inner",
        `preview-stage__inner--${selectedEffectId}`,
        previewChrome.innerClassName
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: currentState.width,
        height: currentState.height,
        transform: `scale(${previewScale})`
      }}
    >
      {selectedEffectId === "button-emitter-aura" ? (
        <div
          className={[
            "button-emitter-demo",
            buttonPreviewVariantClassName
          ]
            .filter(Boolean)
            .join(" ")}
          ref={buttonEmitterHostRef}
          style={buttonEmitterThemeStyle}
        >
          {shaderPreview}
          <button
            className={[
              "button-emitter-demo__button",
              buttonPreviewButtonClassName
            ].join(" ")}
            onClick={() => triggerBurstAnimation("button-emitter-aura")}
            ref={buttonEmitterButtonRef}
            style={buttonEmitterButtonStyle}
            type="button"
          >
            {buttonPreviewLabel}
          </button>
        </div>
      ) : (
        <>
          {previewChrome.overlay ? (
            <div className={previewChrome.overlay.className}>
              <p className="showcase-card__eyebrow">{previewChrome.overlay.eyebrow}</p>
              <h3>{previewChrome.overlay.title}</h3>
              <p>{previewChrome.overlay.body}</p>
            </div>
          ) : null}
          {shaderPreview}
        </>
      )}
    </div>
  );

  const scaledPreviewFrame = (
    <div
      aria-label={selectedEffectId === "ghost-frame" ? previewChrome.interactionLabel : undefined}
      className={[
        "preview-stage__frame-shell",
        previewChrome.frameShellClassName,
        selectedEffectId === "ghost-frame" ? "preview-stage__frame-shell--interactive" : undefined
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={selectedEffectId === "ghost-frame" ? () => triggerBurstAnimation("ghost-frame") : undefined}
      onKeyDown={selectedEffectId === "ghost-frame" ? handleInteractivePreviewKeyDown : undefined}
      role={selectedEffectId === "ghost-frame" ? "button" : undefined}
      style={{
        width: previewWidth,
        height: previewHeight
      }}
      tabIndex={selectedEffectId === "ghost-frame" ? 0 : undefined}
      title={selectedEffectId === "ghost-frame" ? previewChrome.interactionLabel : undefined}
    >
      {previewFrame}
    </div>
  );

  return (
    <div className="app-shell">
      <main className="playground-shell">
        <header className="playground-toolbar">
          <div className="playground-toolbar__copy">
            <h1>{definition.displayName}</h1>
            <p>{presentation.toolbarDescription}</p>
          </div>

          <div className="playground-toolbar__actions">
            <div className="segmented-control" role="tablist" aria-label="Playground view">
              <button
                aria-selected={viewMode === "preview"}
                className={viewMode === "preview" ? "segmented-control__button is-active" : "segmented-control__button"}
                onClick={() => setViewMode("preview")}
                role="tab"
                type="button"
              >
                Preview
              </button>
              <button
                aria-selected={viewMode === "payload"}
                className={viewMode === "payload" ? "segmented-control__button is-active" : "segmented-control__button"}
                onClick={() => setViewMode("payload")}
                role="tab"
                type="button"
              >
                Payload
              </button>
            </div>

            <button className="toolbar-button" onClick={resetCurrentState} type="button">
              Reset
            </button>

            {sourceHref ? (
              <a className="toolbar-button toolbar-button--github" href={sourceHref} rel="noreferrer" target="_blank">
                <GitHubMarkIcon />
                <span>GitHub</span>
              </a>
            ) : (
              <button
                aria-disabled="true"
                className="toolbar-button toolbar-button--github is-disabled"
                title="Set VITE_REPOSITORY_URL to enable this link."
                type="button"
              >
                <GitHubMarkIcon />
                <span>GitHub</span>
              </button>
            )}
          </div>
        </header>

        <div className="playground-body">
          <aside className="playground-sidebar">
            <p className="mono-label">Shaders</p>

            <label className="sidebar-search" htmlFor="shader-search">
              <span className="visually-hidden">Filter components</span>
              <input
                id="shader-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search components"
                type="search"
                value={query}
              />
            </label>

            <div className="effect-list" role="list">
              {visibleEffects.length > 0 ? (
                visibleEffects.map((effectId) => {
                  const effect = getEffectDefinition(effectId);
                  const selected = effectId === selectedEffectId;

                  return (
                    <button
                      className={selected ? "effect-item is-active" : "effect-item"}
                      key={effectId}
                      onClick={() =>
                        startTransition(() => {
                          setSelectedEffectId(effectId);
                          setViewMode("preview");
                        })
                      }
                      type="button"
                    >
                      <span className="effect-item__name">{effect.displayName}</span>
                      <span className="effect-item__description">
                        {effectPresentation[effectId].listDescription}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="effect-list__empty">No components match that filter.</p>
              )}
            </div>
          </aside>

          <section className="playground-main">
            <div className="preview-frame">
              <div className="preview-frame__bar">
                <p className="mono-label">{presentation.previewHint}</p>
                <button className="toolbar-button toolbar-button--compact" onClick={requestFullscreen} type="button">
                  Fullscreen
                </button>
              </div>

              <div className={`preview-stage preview-stage--${selectedEffectId}`} ref={previewViewportRef}>
                {viewMode === "preview" ? (
                  <div
                    className={[
                      "preview-stage__scaled",
                      previewChrome.showcasePadding > 0 ? "preview-stage__scaled--showcase" : undefined
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      width: previewWidth + previewChrome.showcasePadding * 2,
                      height: previewHeight + previewChrome.showcasePadding * 2
                    }}
                  >
                    {previewChrome.showcaseShellClassName ? (
                      <div className={previewChrome.showcaseShellClassName}>{scaledPreviewFrame}</div>
                    ) : (
                      scaledPreviewFrame
                    )}
                  </div>
                ) : (
                  <pre className="payload-panel">{JSON.stringify(nodePayload, null, 2)}</pre>
                )}
              </div>

              <div className="preview-meta-strip">
                <span className="preview-meta-strip__technical">{previewFooterMeta}</span>
                <span>{presentation.previewUseCase}</span>
              </div>
            </div>
          </section>

          <aside className="playground-controls">
            <section className="control-section">
              <h2 className="mono-label">Presets</h2>
              <div className="chip-row">
                {presetsByEffect[selectedEffectId].map((preset) => (
                  <button
                    className="chip"
                    key={preset.name}
                    onClick={() => updateCurrentState((state) => applyPresetToState(state, preset, definition))}
                    title={preset.description}
                    type="button"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="control-section">
              <h2 className="mono-label">Parameters</h2>

              <div className="field">
                <div className="field__header">
                  <span>Mode</span>
                </div>
                <div className="segmented-control segmented-control--field" role="tablist" aria-label="Animation mode">
                  <button
                    aria-selected={!currentState.animate}
                    className={!currentState.animate ? "segmented-control__button is-active" : "segmented-control__button"}
                    onClick={() =>
                      updateCurrentState((state) => ({
                        ...state,
                        animate: false
                      }))
                    }
                    role="tab"
                    type="button"
                  >
                    Static
                  </button>
                  <button
                    aria-selected={currentState.animate}
                    className={currentState.animate ? "segmented-control__button is-active" : "segmented-control__button"}
                    onClick={() =>
                      updateCurrentState((state) => ({
                        ...state,
                        animate: true
                      }))
                    }
                    role="tab"
                    type="button"
                  >
                    Animate
                  </button>
                </div>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Width</span>
                  <input
                    className="field__input"
                    min={120}
                    onChange={(event) =>
                      updateCurrentState((state) => ({
                        ...state,
                        width: Math.max(120, Number(event.target.value))
                      }))
                    }
                    type="number"
                    value={currentState.width}
                  />
                </label>
                <label className="field">
                  <span>Height</span>
                  <input
                    className="field__input"
                    min={120}
                    onChange={(event) =>
                      updateCurrentState((state) => ({
                        ...state,
                        height: Math.max(120, Number(event.target.value))
                      }))
                    }
                    type="number"
                    value={currentState.height}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Seed</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      updateCurrentState((state) => ({
                        ...state,
                        seedInput: event.target.value
                      }))
                    }
                    type="text"
                    value={currentState.seedInput}
                  />
                </label>

                <label className="field">
                  <span>Quality</span>
                  <select
                    className="field__input"
                    onChange={(event) =>
                      updateCurrentState((state) => ({
                        ...state,
                        quality: event.target.value as Quality
                      }))
                    }
                    value={currentState.quality}
                  >
                    {QUALITY_OPTIONS.map((quality) => (
                      <option key={quality} value={quality}>
                        {quality}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="toggle-row">
                <input
                  checked={currentState.manualTime}
                  onChange={(event) =>
                    updateCurrentState((state) => ({
                      ...state,
                      manualTime: event.target.checked
                    }))
                  }
                  type="checkbox"
                />
                <span>Drive time manually</span>
              </label>

              {currentState.manualTime ? (
                <label className="field">
                  <div className="field__header">
                    <span>Time</span>
                    <span className="field__value">{currentState.time.toFixed(2)}s</span>
                  </div>
                  <input
                    className="field__range"
                    max={20}
                    min={0}
                    onChange={(event) =>
                      updateCurrentState((state) => ({
                        ...state,
                        time: Number(event.target.value)
                      }))
                    }
                    step={0.01}
                    type="range"
                    value={currentState.time}
                  />
                </label>
              ) : null}

              {definition.assetSlots.length > 0 ? (
                <div className="field-stack">
                  {definition.assetSlots.map((slot) => {
                    const rawAsset = currentState.assets[slot.name] ?? "";
                    const previewAsset = rawAsset ? resolveAssetSource(rawAsset) : "";

                    return (
                      <div className="field" key={slot.name}>
                        <span>{slot.label}</span>
                        <input
                          className="field__input"
                          onChange={(event) =>
                            updateCurrentState((state) => ({
                              ...state,
                              assets: {
                                ...state.assets,
                                [slot.name]: event.target.value
                              }
                            }))
                          }
                          type="text"
                          value={rawAsset}
                        />
                        {previewAsset ? (
                          <img alt={slot.label} className="asset-preview" src={previewAsset} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {definition.controls.map(renderControl)}
            </section>

            <section className="control-section">
              <h2 className="mono-label">Notes</h2>
              <p className="support-copy">{presentation.notes}</p>
            </section>

            <section className="control-section">
              <h2 className="mono-label">Support</h2>
              <ul className="support-list">
                {presentation.support.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
