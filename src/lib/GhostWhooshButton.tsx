import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode
} from "react";
import {
  GHOST_BASE,
  GHOST_UNDER,
  ghostWhooshButtonDefinition,
  type ButtonGhostWhooshParams
} from "./effects/ghostWhooshButton";
import { EffectCanvas } from "./runtime/EffectCanvas";
import type { EffectSeed, Quality } from "./types";

type ButtonLikeProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
};

export type GhostWhooshButtonProps = ButtonLikeProps & {
  effect?: Partial<ButtonGhostWhooshParams>;
  quality?: Quality;
  animate?: boolean;
  time?: number;
  seed?: EffectSeed;
};

type MeasurementState = Pick<
  ButtonGhostWhooshParams,
  "buttonCenterXPx" | "buttonCenterYPx" | "buttonWidthPx" | "buttonHeightPx" | "buttonRadiusPx"
> & {
  hostWidth: number;
  hostHeight: number;
};

type ControllerState = {
  idleAmount: number;
  burstAmount: number;
  burstPhase: number;
};

const BURST_DURATION_SEC = 0.72;
const IDLE_BLOWOUT_END_SEC = 0.16;
const IDLE_RETURN_DELAY_SEC = 0.18;
const IDLE_RETURN_DURATION_SEC = 0.32;
const IDLE_RECOVERY_END_SEC = BURST_DURATION_SEC + IDLE_RETURN_DELAY_SEC + IDLE_RETURN_DURATION_SEC;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function parseRadiusPx(element: HTMLElement) {
  return Number.parseFloat(getComputedStyle(element).borderTopLeftRadius || "0") || 0;
}

function measureButton(host: HTMLElement, button: HTMLElement) {
  const hostRect = host.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  if (hostRect.width <= 0 || hostRect.height <= 0 || buttonRect.width <= 0 || buttonRect.height <= 0) {
    return null;
  }

  return {
    hostWidth: hostRect.width,
    hostHeight: hostRect.height,
    buttonCenterXPx: buttonRect.left - hostRect.left + buttonRect.width * 0.5,
    buttonCenterYPx: buttonRect.top - hostRect.top + buttonRect.height * 0.5,
    buttonWidthPx: buttonRect.width,
    buttonHeightPx: buttonRect.height,
    buttonRadiusPx: parseRadiusPx(button)
  } satisfies MeasurementState;
}

function burstEnvelope(seconds: number) {
  const phase = clamp01(seconds / BURST_DURATION_SEC);
  const attack = easeOutCubic(seconds / 0.085);
  const decay = 1 - smoothstep(0, 1, (seconds - 0.085) / (BURST_DURATION_SEC - 0.10));

  return {
    amount: Math.max(0, attack * decay),
    phase
  };
}

function idleRecoveryEnvelope(seconds: number) {
  const fadeOut = 1 - smoothstep(0, IDLE_BLOWOUT_END_SEC, seconds);
  const returnStart = BURST_DURATION_SEC + IDLE_RETURN_DELAY_SEC;
  const fadeIn = smoothstep(returnStart, IDLE_RECOVERY_END_SEC, seconds);

  return seconds < returnStart ? fadeOut : fadeIn;
}

function getFallbackMeasurements() {
  return {
    hostWidth: 396,
    hostHeight: 216,
    buttonCenterXPx: 198,
    buttonCenterYPx: 108,
    buttonWidthPx: GHOST_BASE.buttonWidthPx,
    buttonHeightPx: GHOST_BASE.buttonHeightPx,
    buttonRadiusPx: GHOST_BASE.buttonRadiusPx
  } satisfies MeasurementState;
}

function hasCustomValue<T extends keyof ButtonGhostWhooshParams>(
  effect: Partial<ButtonGhostWhooshParams> | undefined,
  key: T
) {
  return effect?.[key] !== undefined;
}

export function GhostWhooshButton({
  effect,
  quality = "auto",
  animate = true,
  time,
  seed,
  children,
  className,
  disabled,
  onClick,
  style,
  type = "button",
  ...buttonProps
}: GhostWhooshButtonProps) {
  const resolvedBaseParams = ghostWhooshButtonDefinition.sanitizeParams({
    ...GHOST_BASE,
    ...effect
  });
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);
  const burstStartMsRef = useRef<number | null>(null);
  const measurementsRef = useRef<MeasurementState>(getFallbackMeasurements());
  const configRef = useRef({
    animate,
    baseParams: ghostWhooshButtonDefinition.sanitizeParams(GHOST_BASE),
    time
  });
  const [measurements, setMeasurements] = useState<MeasurementState>(getFallbackMeasurements);
  const [controller, setController] = useState<ControllerState>({
    idleAmount: GHOST_BASE.idleAmount,
    burstAmount: 0,
    burstPhase: 0
  });

  configRef.current = {
    animate,
    baseParams: resolvedBaseParams,
    time
  };
  const paddingBlock = Math.max(
    72,
    Math.ceil(
      resolvedBaseParams.idleReachPx * 0.56 +
      resolvedBaseParams.underOffsetPx +
      resolvedBaseParams.underHeightPx +
      10
    )
  );
  const paddingInline = Math.max(
    88,
    Math.ceil(
      resolvedBaseParams.whooshRadiusPx +
      resolvedBaseParams.underPadPx +
      resolvedBaseParams.whooshFrontWidthPx * 0.8
    )
  );

  function cancelFrame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function captureGeometry() {
    const host = hostRef.current;
    const button = buttonRef.current;

    if (!host || !button) {
      return measurementsRef.current;
    }

    const next = measureButton(host, button);

    if (!next) {
      return measurementsRef.current;
    }

    setMeasurements((current) => {
      const changed =
        Math.abs(current.hostWidth - next.hostWidth) > 0.25 ||
        Math.abs(current.hostHeight - next.hostHeight) > 0.25 ||
        Math.abs(current.buttonCenterXPx - next.buttonCenterXPx) > 0.25 ||
        Math.abs(current.buttonCenterYPx - next.buttonCenterYPx) > 0.25 ||
        Math.abs(current.buttonWidthPx - next.buttonWidthPx) > 0.25 ||
        Math.abs(current.buttonHeightPx - next.buttonHeightPx) > 0.25 ||
        Math.abs(current.buttonRadiusPx - next.buttonRadiusPx) > 0.25;

      const resolved = changed ? next : current;
      measurementsRef.current = resolved;
      return resolved;
    });

    return next;
  }

  function updateController(nowMs: number) {
    captureGeometry();
    const currentBaseParams = configRef.current.baseParams;
    const burstStartMs = burstStartMsRef.current;
    const referenceMs = typeof configRef.current.time === "number" ? configRef.current.time * 1000 : nowMs;
    const breath = 0.5 + 0.5 * Math.sin(referenceMs * 0.001 * 1.15 + 1.7);
    const idleBaseAmount = currentBaseParams.idleAmount * (0.82 + breath * 0.22);
    let idleAmount = idleBaseAmount;
    let burstAmount = 0;
    let burstPhase = 0;
    let burstActive = false;

    if (burstStartMs !== null) {
      const elapsedSec = Math.max(0, (nowMs - burstStartMs) * 0.001);
      const burst = burstEnvelope(elapsedSec);
      const idleVisibility = idleRecoveryEnvelope(elapsedSec);
      burstAmount = burst.amount;
      burstPhase = burst.phase;
      idleAmount = idleBaseAmount * idleVisibility;
      burstActive = elapsedSec < IDLE_RECOVERY_END_SEC;

      if (elapsedSec >= IDLE_RECOVERY_END_SEC) {
        burstStartMsRef.current = null;
      }
    }

    setController((current) => {
      const next = {
        idleAmount,
        burstAmount,
        burstPhase
      } satisfies ControllerState;
      const changed =
        Math.abs(current.idleAmount - next.idleAmount) > 0.0005 ||
        Math.abs(current.burstAmount - next.burstAmount) > 0.0005 ||
        Math.abs(current.burstPhase - next.burstPhase) > 0.0005;

      return changed ? next : current;
    });

    return {
      keepRunning: configRef.current.animate || burstActive
    };
  }

  function frame(nowMs: number) {
    frameRef.current = null;
    const { keepRunning } = updateController(nowMs);

    if (keepRunning) {
      frameRef.current = requestAnimationFrame(frame);
    }
  }

  function ensureFrame() {
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(frame);
    }
  }

  useEffect(() => {
    measurementsRef.current = measurements;
  }, [measurements]);

  useEffect(() => {
    const host = hostRef.current;
    const button = buttonRef.current;

    if (!host || !button) {
      return undefined;
    }

    captureGeometry();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      captureGeometry();
    });

    observer.observe(host);
    observer.observe(button);

    return () => observer.disconnect();
  }, []);

  const baseParamsKey = JSON.stringify(resolvedBaseParams);

  useEffect(() => {
    updateController(performance.now());

    if (animate) {
      ensureFrame();
    } else if (burstStartMsRef.current !== null) {
      ensureFrame();
    } else {
      cancelFrame();
    }

    return () => {
      if (!animate && burstStartMsRef.current === null) {
        cancelFrame();
      }
    };
  }, [animate, time, baseParamsKey]);

  useEffect(() => {
    if (disabled) {
      cancelFrame();
      burstStartMsRef.current = null;
      setController((current) => ({
        ...current,
        burstAmount: 0,
        burstPhase: 0
      }));
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      cancelFrame();
    };
  }, []);

  const overParams = ghostWhooshButtonDefinition.sanitizeParams({
    ...resolvedBaseParams,
    ...measurements,
    idleAmount: controller.idleAmount,
    burstAmount: controller.burstAmount,
    burstPhase: controller.burstPhase
  });
  const underParams = ghostWhooshButtonDefinition.sanitizeParams({
    ...resolvedBaseParams,
    ...measurements,
    idleAmount: controller.idleAmount * 0.8,
    burstAmount: controller.burstAmount,
    burstPhase: controller.burstPhase,
    idleOpacity: GHOST_UNDER.idleOpacity,
    burstOpacity: GHOST_UNDER.burstOpacity,
    interiorOpacity: GHOST_UNDER.interiorOpacity,
    glowStrength: hasCustomValue(effect, "glowStrength")
      ? Math.max(
          0,
          Math.min(
            1,
            resolvedBaseParams.glowStrength * (GHOST_UNDER.glowStrength / GHOST_BASE.glowStrength)
          )
        )
      : GHOST_UNDER.glowStrength,
    tintA: hasCustomValue(effect, "tintA") ? resolvedBaseParams.tintA : GHOST_UNDER.tintA,
    tintB: hasCustomValue(effect, "tintB") ? resolvedBaseParams.tintB : GHOST_UNDER.tintB
  });

  const hostStyle = {
    position: "relative",
    display: "inline-grid",
    placeItems: "center",
    padding: `${paddingBlock}px ${paddingInline}px`,
    isolation: "isolate",
    overflow: "visible"
  } satisfies CSSProperties;
  const layerStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  } satisfies CSSProperties;
  const buttonStyle = {
    position: "relative",
    zIndex: 1,
    minWidth: "220px",
    height: "72px",
    padding: "0 28px",
    borderRadius: "22px",
    border: "1px solid rgba(220, 240, 255, 0.34)",
    color: "#eef9ff",
    background: "rgba(10, 18, 28, 0.92)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 28px rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)",
    font: "600 16px/1 system-ui, sans-serif",
    transition: "transform 120ms ease-out",
    transform: "scale(1)",
    ...style
  } satisfies CSSProperties;

  return (
    <div ref={hostRef} style={hostStyle}>
      <span aria-hidden="true" style={{ ...layerStyle, zIndex: 0 }}>
        <EffectCanvas
          animate={animate}
          className="ghost-whoosh-button__layer ghost-whoosh-button__layer--under"
          definition={ghostWhooshButtonDefinition}
          height={Math.max(1, measurements.hostHeight)}
          params={underParams}
          quality={quality}
          seed={seed}
          style={layerStyle}
          time={time}
          width={Math.max(1, measurements.hostWidth)}
        />
      </span>
      <button
        {...buttonProps}
        className={className}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented || disabled) {
            return;
          }

          burstStartMsRef.current = performance.now();
          setController((current) => ({
            ...current,
            burstAmount: 1,
            burstPhase: 0
          }));
          ensureFrame();
        }}
        ref={buttonRef}
        style={buttonStyle}
        type={type}
      >
        {children ?? "Sign up"}
      </button>
      <span aria-hidden="true" style={{ ...layerStyle, zIndex: 2 }}>
        <EffectCanvas
          animate={animate}
          className="ghost-whoosh-button__layer ghost-whoosh-button__layer--over"
          definition={ghostWhooshButtonDefinition}
          height={Math.max(1, measurements.hostHeight)}
          params={overParams}
          quality={quality}
          seed={seed}
          style={layerStyle}
          time={time}
          width={Math.max(1, measurements.hostWidth)}
        />
      </span>
    </div>
  );
}
