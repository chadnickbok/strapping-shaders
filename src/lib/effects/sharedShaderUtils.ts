export const MAX_SHARED_PALETTE_COLORS = 6;

export const REQUIRED_IMAGE_ASSET_SLOT = {
  name: "sourceImage",
  label: "Source image",
  required: true,
  accept: "image" as const
};

export const OPTIONAL_IMAGE_ASSET_SLOT = {
  name: "sourceImage",
  label: "Source image",
  required: false,
  accept: "image" as const
};

export const GLSL_COMMON = `
const float PI = 3.141592653589793;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

mat2 rot2(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash11(float value) {
  return fract(sin(value * 127.1) * 43758.5453123);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash22(vec2 p) {
  return vec2(
    fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123),
    fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123)
  );
}

float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 smoothLocal = local * local * (3.0 - 2.0 * local);
  float a = hash21(cell);
  float b = hash21(cell + vec2(1.0, 0.0));
  float c = hash21(cell + vec2(0.0, 1.0));
  float d = hash21(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, smoothLocal.x), mix(c, d, smoothLocal.x), smoothLocal.y);
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;

  for (int octave = 0; octave < 5; octave += 1) {
    total += amplitude * noise(p);
    p = p * 2.03 + vec2(13.1, 5.7);
    amplitude *= 0.55;
  }

  return total;
}

vec2 fbmVec2(vec2 p) {
  return vec2(
    fbm(p + vec2(7.3, 1.7)),
    fbm(p + vec2(-3.1, 8.9))
  );
}

float luma(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}

float softBand(float value, float center, float width, float feather) {
  float distanceToCenter = abs(value - center);
  return 1.0 - smoothstep(width - feather, width + feather, distanceToCenter);
}
`;

export const GLSL_IMAGE_UTILS = `
vec2 coverUv(vec2 uv, vec2 imageSize, vec2 frameSize) {
  float imageAspect = imageSize.x / max(imageSize.y, 0.0001);
  float frameAspect = frameSize.x / max(frameSize.y, 0.0001);
  vec2 scale = vec2(1.0);
  vec2 offset = vec2(0.0);

  if (imageAspect > frameAspect) {
    scale.x = frameAspect / imageAspect;
    offset.x = (1.0 - scale.x) * 0.5;
  } else {
    scale.y = imageAspect / frameAspect;
    offset.y = (1.0 - scale.y) * 0.5;
  }

  return offset + uv * scale;
}

vec4 sampleClamped(sampler2D textureSampler, vec2 uv) {
  return texture(textureSampler, clamp(uv, 0.001, 0.999));
}
`;

export const GLSL_WORLEY_UTILS = `
vec2 worley(vec2 p, float seed) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float nearest = 8.0;
  float secondNearest = 8.0;

  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = hash22(cell + offset + seed * 31.7);
      vec2 diff = offset + point - local;
      float distanceSquared = dot(diff, diff);

      if (distanceSquared < nearest) {
        secondNearest = nearest;
        nearest = distanceSquared;
      } else if (distanceSquared < secondNearest) {
        secondNearest = distanceSquared;
      }
    }
  }

  return sqrt(max(vec2(nearest, secondNearest), vec2(0.0)));
}
`;

export const GLSL_HSL_UTILS = `
vec3 hslToRgb(vec3 hsl) {
  vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
  return (rgb - 0.5) * c + hsl.z;
}
`;
