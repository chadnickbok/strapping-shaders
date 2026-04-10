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
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const sanitizedParams = definition.sanitizeParams(params);
  const missingAssets = definition.assetSlots.filter((slot) => slot.required && !assets[slot.name]);
  const resolvedSeed = normalizeSeed(seed);
  const requestedAssets = Object.fromEntries(
    definition.assetSlots
      .map((slot) => [slot.name, assets[slot.name]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
  const { images, errors, loading } = useAssetImages(requestedAssets);

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
    let animationFrame = 0;
    let disposed = false;
    let elapsedTime = typeof time === "number" ? time : 0;
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
        if (disposed) {
          return;
        }

        if (typeof time === "number") {
          elapsedTime = time;
        } else if (animate) {
          if (previousTimestamp === 0) {
            previousTimestamp = timestamp;
          }

          elapsedTime += (timestamp - previousTimestamp) / 1000;
          previousTimestamp = timestamp;
        }

        const renderScale = qualityToScale(quality, width, height);
        const { pixelWidth, pixelHeight } = resizeCanvasToDisplaySize(canvas, width, height, renderScale);

        gl.viewport(0, 0, pixelWidth, pixelHeight);
        // alphaMode controls the cleared backdrop; individual effects may still write fragment alpha.
        gl.clearColor(0, 0, 0, definition.alphaMode === "transparent" ? 0 : 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        bindTextureResources(gl, textures);

        setUniformVec2(gl, locations.uResolution, pixelWidth, pixelHeight);
        setUniformFloat(gl, locations.uTime, elapsedTime);
        setUniformFloat(gl, locations.uSeed, resolvedSeed);
        setUniformFloat(gl, locations.uQualityScale, renderScale);

        definition.applyUniforms({
          gl,
          locations,
          params: sanitizedParams,
          resolution: [pixelWidth, pixelHeight],
          time: elapsedTime,
          seed: resolvedSeed,
          qualityScale: renderScale,
          textures
        });

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (typeof time !== "number" && animate) {
          animationFrame = requestAnimationFrame(renderFrame);
        }
      };

      renderFrame(performance.now());

      if (typeof time !== "number" && animate) {
        animationFrame = requestAnimationFrame(renderFrame);
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        destroyTextureResources(gl, textures);
        if (program) {
          gl.deleteProgram(program);
        }
        if (vao) {
          gl.deleteVertexArray(vao);
        }
      };
    } catch (error) {
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
    animate,
    assetSignature(requestedAssets),
    definition,
    errors,
    height,
    loading,
    quality,
    resolvedSeed,
    time,
    width,
    missingAssets.length,
    paramsSignature(sanitizedParams)
  ]);

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
