import { describe, expect, it, vi } from "vitest";
import { auroraFieldDefinition } from "./auroraField";

describe("auroraFieldDefinition.applyUniforms", () => {
  it("falls back to the default palette when runtime params are missing palette entries", () => {
    const uniform1f = vi.fn();
    const uniform1i = vi.fn();
    const uniform3fv = vi.fn();
    const gl = {
      uniform1f,
      uniform1i,
      uniform3fv
    } as unknown as WebGL2RenderingContext;

    expect(() =>
      auroraFieldDefinition.applyUniforms({
        gl,
        locations: {
          uDensity: {} as WebGLUniformLocation,
          uFlow: {} as WebGLUniformLocation,
          uContrast: {} as WebGLUniformLocation,
          uOpacity: {} as WebGLUniformLocation,
          uPaletteCount: {} as WebGLUniformLocation,
          "uPalette[0]": {} as WebGLUniformLocation
        },
        params: {
          density: 0.45,
          flow: 0.5,
          contrast: 0.55,
          opacity: 1
        } as unknown as Parameters<typeof auroraFieldDefinition.applyUniforms>[0]["params"],
        resolution: [320, 180],
        displaySize: [320, 180],
        time: 0,
        seed: 0.5,
        qualityScale: 1,
        textures: {}
      })
    ).not.toThrow();

    expect(uniform1i).toHaveBeenCalledWith(expect.anything(), 4);
    expect(uniform3fv).toHaveBeenCalledTimes(1);
  });
});
