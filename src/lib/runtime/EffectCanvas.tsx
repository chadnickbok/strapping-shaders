import { useEffect, useRef, useState } from "react";
import type { EffectComponentProps, EffectDefinition } from "../types";
import { assetSignature, normalizeSeed, paramsSignature, qualityToScale } from "./utils";
import {
  bindTextureResources,
  createFullscreenVao,
  createProgram,
  createTextureResources,
  destroyTextureResources,
  getUniformLocations,
  resizeCanvasToDisplaySize,
  setUniformFloat,
  setUniformVec2
} from "./webgl";
import { useAssetImages } from "./useAssetImages";

type EffectCanvasProps<TParams extends Record<string, unknown>> = EffectComponentProps<TParams> & {
  definition: EffectDefinition<TParams>;
};

export function EffectCanvas<TParams extends Record<string, unknown>>({
  definition,
  width,
  height,
  params,
  seed,
  animate = true,
  time,
  assets = {},
  quality = "auto",
  className,
  style
}: EffectCanvasProps<TParams>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const sanitizedParams = definition.sanitizeParams(params);
  const missingAssets = definition.assetSlots.filter((slot) => slot.required && !assets[slot.name]);
  const resolvedSeed = normalizeSeed(seed);
  const frameStateRef = useRef({
    animate,
    height,
    params: sanitizedParams,
    quality,
    resolvedSeed,
    time,
    width
  });
  const requestedAssets = Object.fromEntries(
    definition.assetSlots
      .map((slot) => [slot.name, assets[slot.name]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
  const { images, errors, loading } = useAssetImages(requestedAssets);
  const paramsKey = paramsSignature(sanitizedParams);

  frameStateRef.current = {
    animate,
    height,
    params: sanitizedParams,
    quality,
    resolvedSeed,
    time,
    width
  };

  useEffect(() => {
    if (missingAssets.length > 0) {
      setRuntimeError(null);
      return undefined;
    }

    if (Object.keys(errors).length > 0) {
      setRuntimeError(Object.values(errors)[0] ?? "Unable to load one or more assets.");
      return undefined;
    }

    if (loading) {
      setRuntimeError(null);
      return undefined;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });

    if (!gl) {
      setRuntimeError("WebGL2 is unavailable in this browser.");
      return undefined;
    }

    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let animationFrame: number | null = null;
    let disposed = false;
    let elapsedTime = typeof frameStateRef.current.time === "number" ? frameStateRef.current.time : 0;
    let previousTimestamp = 0;

    try {
      program = createProgram(gl, definition.fragmentShader);
      vao = createFullscreenVao(gl);
      const textures = createTextureResources(gl, images);
      const locations = getUniformLocations(gl, program, [
        "uResolution",
        "uTime",
        "uSeed",
        "uQualityScale",
        ...definition.uniformNames
      ]);

      setRuntimeError(null);

      const renderFrame = (timestamp: number) => {
        animationFrame = null;

        if (disposed) {
          return;
        }

        const frameState = frameStateRef.current;

        if (typeof frameState.time === "number") {
          elapsedTime = frameState.time;
          previousTimestamp = timestamp;
        } else if (frameState.animate) {
          if (previousTimestamp === 0) {
            previousTimestamp = timestamp;
          }

          elapsedTime += (timestamp - previousTimestamp) / 1000;
          previousTimestamp = timestamp;
        } else {
          previousTimestamp = timestamp;
        }

        const renderScale = qualityToScale(frameState.quality, frameState.width, frameState.height);
        const { pixelWidth, pixelHeight } = resizeCanvasToDisplaySize(
          canvas,
          frameState.width,
          frameState.height,
          renderScale
        );

        gl.viewport(0, 0, pixelWidth, pixelHeight);
        // alphaMode controls the cleared backdrop; individual effects may still write fragment alpha.
        gl.clearColor(0, 0, 0, definition.alphaMode === "transparent" ? 0 : 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        bindTextureResources(gl, textures);

        setUniformVec2(gl, locations.uResolution, pixelWidth, pixelHeight);
        setUniformFloat(gl, locations.uTime, elapsedTime);
        setUniformFloat(gl, locations.uSeed, frameState.resolvedSeed);
        setUniformFloat(gl, locations.uQualityScale, renderScale);

        definition.applyUniforms({
          gl,
          locations,
          params: frameState.params,
          resolution: [pixelWidth, pixelHeight],
          displaySize: [frameState.width, frameState.height],
          time: elapsedTime,
          seed: frameState.resolvedSeed,
          qualityScale: renderScale,
          textures
        });

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (typeof frameState.time !== "number" && frameState.animate) {
          animationFrame = requestAnimationFrame(renderFrame);
        }
      };

      requestRenderRef.current = () => {
        if (disposed || animationFrame !== null) {
          return;
        }

        animationFrame = requestAnimationFrame(renderFrame);
      };

      renderFrame(performance.now());

      return () => {
        disposed = true;
        requestRenderRef.current = null;

        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
        }

        destroyTextureResources(gl, textures);
        if (program) {
          gl.deleteProgram(program);
        }
        if (vao) {
          gl.deleteVertexArray(vao);
        }
      };
    } catch (error) {
      requestRenderRef.current = null;
      setRuntimeError(error instanceof Error ? error.message : "Unable to render shader.");
      if (program) {
        gl.deleteProgram(program);
      }
      if (vao) {
        gl.deleteVertexArray(vao);
      }
      return undefined;
    }
  }, [
    assetSignature(requestedAssets),
    definition,
    errors,
    loading,
    missingAssets.length
  ]);

  useEffect(() => {
    requestRenderRef.current?.();
  }, [animate, height, paramsKey, quality, resolvedSeed, time, width]);

  const statusMessage =
    missingAssets.length > 0
      ? `Missing required asset: ${missingAssets.map((slot) => slot.label).join(", ")}`
      : runtimeError;

  return (
    <div className={["effect-canvas", className].filter(Boolean).join(" ")} style={style}>
      <canvas
        aria-label={definition.displayName}
        ref={canvasRef}
        style={{ width, height }}
      />
      {loading ? <div className="effect-status">Loading asset…</div> : null}
      {statusMessage ? <div className="effect-status">{statusMessage}</div> : null}
    </div>
  );
}
