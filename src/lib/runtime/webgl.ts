import type { TextureResource } from "../types";

const VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 POSITIONS[3] = vec2[](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

out vec2 vUv;

void main() {
  vec2 position = POSITIONS[gl_VertexID];
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to allocate a WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

export function createProgram(gl: WebGL2RenderingContext, fragmentShaderSource: string) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to allocate a WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

export function createFullscreenVao(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();

  if (!vao) {
    throw new Error("Unable to allocate a vertex array.");
  }

  gl.bindVertexArray(vao);
  return vao;
}

export function getUniformLocations(gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]) {
  return Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, name)])
  );
}

export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  renderScale: number
) {
  const devicePixelRatio = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(width * devicePixelRatio * renderScale));
  const pixelHeight = Math.max(1, Math.round(height * devicePixelRatio * renderScale));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  return {
    pixelWidth,
    pixelHeight
  };
}

export function createTextureResources(
  gl: WebGL2RenderingContext,
  images: Record<string, HTMLImageElement>
) {
  const textures: Record<string, TextureResource> = {};
  let unit = 0;

  for (const [slot, image] of Object.entries(images)) {
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error(`Unable to allocate texture for "${slot}".`);
    }

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    textures[slot] = {
      texture,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      unit,
      src: image.currentSrc || image.src
    };

    unit += 1;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

  return textures;
}

export function bindTextureResources(gl: WebGL2RenderingContext, textures: Record<string, TextureResource>) {
  for (const { texture, unit } of Object.values(textures)) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }
}

export function destroyTextureResources(gl: WebGL2RenderingContext, textures: Record<string, TextureResource>) {
  for (const { texture } of Object.values(textures)) {
    gl.deleteTexture(texture);
  }
}

export function setUniformFloat(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  value: number
) {
  if (location) {
    gl.uniform1f(location, value);
  }
}

export function setUniformInt(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  value: number
) {
  if (location) {
    gl.uniform1i(location, value);
  }
}

export function setUniformVec2(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  x: number,
  y: number
) {
  if (location) {
    gl.uniform2f(location, x, y);
  }
}

export function setUniformVec3(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  x: number,
  y: number,
  z: number
) {
  if (location) {
    gl.uniform3f(location, x, y, z);
  }
}

export function setUniformVec3Array(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  value: Float32Array
) {
  if (location) {
    gl.uniform3fv(location, value);
  }
}
