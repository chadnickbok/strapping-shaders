import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { GhostWhooshButton, ShaderRenderer, effectOrder } from "../lib";
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
import { cssColorToHex, hexToRgb } from "../lib/runtime/utils";

const QUALITY_OPTIONS: Quality[] = ["auto", "high", "medium", "low"];
const repositoryBaseUrl = ((import.meta.env.VITE_REPOSITORY_URL as string | undefined) ?? "")
  .trim()
  .replace(/\/$/, "");

type ViewMode = "preview" | "payload";
type PlaygroundEffectId = EffectId;
type BurstEffectId = "ghost-frame" | "button-emitter-aura" | "button-ghost-whoosh";
type ButtonPreviewEffectId = "button-emitter-aura" | "button-ghost-whoosh";

const PLAYGROUND_EFFECT_IDS = effectOrder as readonly PlaygroundEffectId[];
const BURST_EFFECT_IDS = ["ghost-frame", "button-emitter-aura", "button-ghost-whoosh"] as const;

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

const BUTTON_GEOMETRY_KEYS = [
  "buttonCenterXPx",
  "buttonCenterYPx",
  "buttonWidthPx",
  "buttonHeightPx",
  "buttonRadiusPx"
] as const;

const DOC_BASENAME_BY_EFFECT: Record<EffectId, string> = {
  "aurora-field": "aurora",
  "flowing-gradient": "flowing-gradient",
  "cinematic-bokeh": "cinematic-bokeh",
  "soap-film-interference": "soap-film-interference",
  "frosted-acrylic": "frosted-acrylic",
  "moire-silk": "moire-silk",
  "studio-dither-fade": "studio-dither-fade",
  "caustic-pool": "caustic-pool",
  contours: "contours",
  dithering: "dithering",
  "voronoi-caustics": "voronoi-caustics",
  "holographic-foil": "holographic-foil",
  "ink-bleed": "ink-bleed",
  "jelly-spiral": "jelly-spiral",
  "lava-lamp": "lava-lamp",
  "liquid-distortion": "liquid-distortion",
  "orbit-confetti": "orbit-confetti",
  "paper-fibers": "paper-fibers",
  "plasma-checker": "plasma-checker",
  "prism-refraction": "prism-refraction",
  "riso-misprint": "riso-misprint",
  "stained-glass": "stained-glass",
  "star-tunnel": "star-tunnel",
  "thermal-bloom": "thermal-bloom",
  "truchet-neon": "truchet-neon",
  "velvet-mesh": "velvet-mesh",
  "vhs-poster": "vhs-poster",
  "ghost-frame": "ghost-frame",
  "button-emitter-aura": "button-emitter-aura",
  "button-ghost-whoosh": "button-ghost-whoosh",
  "ghost-whoosh-button": "ghost-whoosh-button",
  "pulse-trace-border": "pulse-trace-border"
};

function isBurstEffect(effectId: PlaygroundEffectId): effectId is BurstEffectId {
  return effectId === "ghost-frame" || effectId === "button-emitter-aura" || effectId === "button-ghost-whoosh";
}

function isButtonPreviewEffect(effectId: PlaygroundEffectId): effectId is ButtonPreviewEffectId {
  return effectId === "button-emitter-aura" || effectId === "button-ghost-whoosh";
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

function buildDefaultSupport(definition: AnyEffectDefinition) {
  return [
    "WebGL2",
    definition.alphaMode === "transparent" ? "Transparent output" : "Opaque output",
    definition.assetSlots.length > 0
      ? `${definition.assetSlots[0]?.required ? "Requires" : "Supports"} a source image`
      : "No texture input"
  ];
}

function defaultPreviewHint(effectId: EffectId, definition: AnyEffectDefinition) {
  if (effectId === "ghost-frame") {
    return "Click the card to trigger a poof burst";
  }

  if (effectId === "button-emitter-aura" || effectId === "button-ghost-whoosh") {
    return "Click the demo button to trigger the host-driven burst";
  }

  if (effectId === "ghost-whoosh-button") {
    return "Click the standalone button to inspect the component-owned burst timeline";
  }

  if (definition.assetSlots.length > 0) {
    return "Use the bundled sample image to tune the treatment against real content";
  }

  return "Adjust parameters and inspect the authored surface in the preview stage";
}

function defaultPreviewUseCase(effectId: EffectId, definition: AnyEffectDefinition) {
  if (effectId.includes("button")) {
    return "Buttons / CTAs / interactive actions";
  }

  if (effectId.includes("border") || effectId.includes("frame")) {
    return "Cards / borders / UI surfaces";
  }

  if (definition.assetSlots.length > 0) {
    return "Image treatments / posters / media surfaces";
  }

  return "Backgrounds / decorative surfaces / hero panels";
}

function defaultNotes(effectId: EffectId, definition: AnyEffectDefinition) {
  if (effectId === "ghost-whoosh-button") {
    return "This preview uses the higher-level React component so the measured button geometry and dual-layer burst timeline stay aligned with the shipped component contract.";
  }

  if (effectId === "button-ghost-whoosh") {
    return "This preview uses a real DOM button and writes its measured bounds into the low-level shader params so the raw study can be tuned in the generic playground.";
  }

  return definition.summary;
}

const effectPresentation = Object.fromEntries(
  PLAYGROUND_EFFECT_IDS.map((effectId) => {
    const definition = getEffectDefinition(effectId) as AnyEffectDefinition;
    return [
      effectId,
      {
        listDescription: definition.summary,
        toolbarDescription: definition.summary,
        previewHint: defaultPreviewHint(effectId, definition),
        previewUseCase: defaultPreviewUseCase(effectId, definition),
        notes: defaultNotes(effectId, definition),
        support: buildDefaultSupport(definition),
        sourcePath: `docs/${DOC_BASENAME_BY_EFFECT[effectId]}.md`
      } satisfies EffectPresentation
    ];
  })
) as Record<PlaygroundEffectId, EffectPresentation>;

const previewChromeByEffect = Object.fromEntries(
  PLAYGROUND_EFFECT_IDS.map((effectId) => [effectId, { showcasePadding: 0 } satisfies PreviewChrome])
) as Record<PlaygroundEffectId, PreviewChrome>;

previewChromeByEffect["ghost-frame"] = {
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
};

previewChromeByEffect["button-emitter-aura"] = {
  showcasePadding: 36,
  frameShellClassName: "preview-stage__frame-shell--button-emitter",
  innerClassName: "preview-stage__inner--button-emitter",
  showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--button-emitter"
};

previewChromeByEffect["button-ghost-whoosh"] = {
  showcasePadding: 36,
  frameShellClassName: "preview-stage__frame-shell--button-ghost-whoosh",
  innerClassName: "preview-stage__inner--button-ghost-whoosh",
  showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--button-ghost-whoosh"
};

previewChromeByEffect["ghost-whoosh-button"] = {
  showcasePadding: 36,
  frameShellClassName: "preview-stage__frame-shell--ghost-whoosh",
  innerClassName: "preview-stage__inner--ghost-whoosh-button",
  showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--ghost-whoosh-button"
};

previewChromeByEffect["pulse-trace-border"] = {
  showcasePadding: 36,
  frameShellClassName: "preview-stage__frame-shell--pulse",
  innerClassName: "preview-stage__inner--pulse-trace",
  showcaseShellClassName: "preview-showcase-shell preview-showcase-shell--pulse-trace",
  overlay: {
    className: "showcase-card showcase-card--pulse-trace",
    eyebrow: "CTA border",
    title: "Pulse Trace",
    body: "Traveling light packets skim the frame, stack trails, and flare around the corners."
  }
};

function createInitialStates() {
  return Object.fromEntries(
    PLAYGROUND_EFFECT_IDS.map((effectId) => [effectId, createPlaygroundState(defaultNodes[effectId])])
  ) as Record<PlaygroundEffectId, PlaygroundEffectState>;
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
  const buttonPreviewVariantClassName =
    selectedEffectId === "button-ghost-whoosh"
      ? "button-emitter-demo--ghost-whoosh-2"
      : buttonEmitterLooksFireLike
        ? "button-emitter-demo--fire"
        : "button-emitter-demo--ghost";
  const buttonPreviewButtonClassName =
    selectedEffectId === "button-ghost-whoosh"
      ? "button-emitter-demo__button--ghost-whoosh-2"
      : buttonEmitterLooksFireLike
        ? "button-emitter-demo__button--fire"
        : "button-emitter-demo__button--ghost";
  const buttonPreviewLabel =
    selectedEffectId === "button-ghost-whoosh"
      ? "Ghost Whoosh 2"
      : buttonEmitterLooksFireLike
        ? "Fire Button"
        : "Ghost Button";
  const buttonEmitterThemeStyle = {
    "--button-emitter-accent-soft": rgbaFromHex(
      buttonEmitterTintA,
      selectedEffectId === "button-ghost-whoosh"
        ? 0.08 + buttonEmitterGlowStrength * 0.08
        : buttonEmitterLooksFireLike
          ? 0.06 + buttonEmitterGlowStrength * 0.08
          : 0.05 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-accent-strong": rgbaFromHex(
      buttonEmitterTintB,
      selectedEffectId === "button-ghost-whoosh"
        ? 0.2 + buttonEmitterGlowStrength * 0.1
        : buttonEmitterLooksFireLike
          ? 0.22 + buttonEmitterGlowStrength * 0.08
          : 0.16 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-border": rgbaFromHex(
      buttonEmitterTintB,
      selectedEffectId === "button-ghost-whoosh"
        ? 0.22 + buttonEmitterGlowStrength * 0.08
        : buttonEmitterLooksFireLike
          ? 0.26 + buttonEmitterGlowStrength * 0.08
          : 0.16 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-shadow": rgbaFromHex(
      buttonEmitterTintB,
      selectedEffectId === "button-ghost-whoosh"
        ? 0.12 + buttonEmitterGlowStrength * 0.08
        : buttonEmitterLooksFireLike
          ? 0.16 + buttonEmitterGlowStrength * 0.1
          : 0.1 + buttonEmitterGlowStrength * 0.08
    ),
    "--button-emitter-text":
      selectedEffectId === "button-ghost-whoosh"
        ? "#f2fbff"
        : buttonEmitterLooksFireLike
          ? "#fff6ea"
          : "#f7fbff"
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
        const hasChanged = BUTTON_GEOMETRY_KEYS.some((key) => {
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

    if (control.kind === "select") {
      const selectedValue = typeof value === "string" ? value : control.options[0]?.value ?? "";

      return (
        <label className="field" key={control.name}>
          <span>{control.label}</span>
          <select
            className="field__input"
            onChange={(event) =>
              updateParams({
                ...currentState.params,
                [control.name]: event.target.value
              })
            }
            value={selectedValue}
          >
            {control.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (control.kind === "color") {
      const colorValue = typeof value === "string" ? value : "#ffffff";

      return (
        <label className="field field--color" key={control.name}>
          <span>{control.label}</span>
          <div className="field__color-row">
            <input
              className="field__input"
              onChange={(event) =>
                updateParams({
                  ...currentState.params,
                  [control.name]: event.target.value
                })
              }
              type="text"
              value={colorValue}
            />
            <input
              className="field__color"
              onChange={(event) =>
                updateParams({
                  ...currentState.params,
                  [control.name]: event.target.value
                })
              }
              type="color"
              value={cssColorToHex(colorValue)}
            />
          </div>
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
      className={[
        "preview-renderer",
        selectedEffectId === "button-emitter-aura" ? "preview-renderer--button-emitter" : undefined,
        selectedEffectId === "button-ghost-whoosh" ? "preview-renderer--button-ghost-whoosh" : undefined
      ]
        .filter(Boolean)
        .join(" ")}
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
      {isButtonPreviewEffect(selectedEffectId) ? (
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
            onClick={() => triggerBurstAnimation(selectedEffectId)}
            ref={buttonEmitterButtonRef}
            style={buttonEmitterButtonStyle}
            type="button"
          >
            {buttonPreviewLabel}
          </button>
        </div>
      ) : selectedEffectId === "ghost-whoosh-button" ? (
        <div
          className="ghost-whoosh-demo"
          style={{
            width: "100%",
            height: "100%"
          }}
        >
          <GhostWhooshButton
            animate={currentState.animate}
            effect={currentState.params}
            quality={currentState.quality}
            seed={currentState.seedInput.trim() ? currentState.seedInput : undefined}
            time={currentState.manualTime ? currentState.time : undefined}
          >
            Stored Smoke CTA
          </GhostWhooshButton>
        </div>
      ) : selectedEffectId === "pulse-trace-border" && previewChrome.overlay ? (
        <div className="pulse-trace-demo">
          {shaderPreview}
          <div className="pulse-trace-demo__content">
            <div className="pulse-trace-demo__copy">
              <p className="showcase-card__eyebrow">{previewChrome.overlay.eyebrow}</p>
              <h3>{previewChrome.overlay.title}</h3>
              <p>{previewChrome.overlay.body}</p>
            </div>
          </div>
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
