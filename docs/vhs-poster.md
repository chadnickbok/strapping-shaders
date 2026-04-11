# VHS Poster

VHS Poster is an analog-video treatment for still images and compositions. It combines scanlines, chromatic errors, jitter, and mild optical warping without needing to max out every retro artifact at once.

## Visual Behavior

The default output should preserve the source composition while adding a clearly analog layer: visible scanlines, modest RGB split, low-amplitude jitter, and light luma noise. Higher `barrelWarp` should push the image toward a CRT-like feel. Higher `noise` should add tape or broadcast roughness.

## High-Level Components

- source-image post processing
- RGB channel offsets
- scanlines or grille
- luma and chroma noise
- horizontal jitter
- optional barrel distortion and glow

## Plausible Implementation

Start from the source image and stack image-space effects: channel offsets, scanlines, luma noise, horizontal jitter, slight barrel warp, and optional glare. This is a classic post-processing family and does not require a complex geometry or simulation layer.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: preserve source alpha when relevant

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| scanlines | number | 0.3 | `0..1` | Strength of horizontal line structure |
| chromaShift | number | 0.15 | `0..1` | RGB separation amount |
| jitter | number | 0.1 | `0..1` | Horizontal or frame wobble |
| noise | number | 0.14 | `0..1` | Tape and luma noise |
| barrelWarp | number | 0.08 | `0..1` | CRT-like screen curvature |
| glow | number | 0.1 | `0..1` | Highlight bloom or glare |
| contrast | number | 0.45 | `0..1` | Tonal punch after degradation |

## Sizing Behavior

The effect is content-aware and image-space. Resizing should preserve the intent of the scanline density and distortion instead of turning them into giant posterized bands.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze noise and jitter in a valid treated frame.
- Fixed `seed`, params, frame size, source image, and `time` should produce deterministic output.

## Performance And Fallbacks

This is usually cheap because it is mostly a 2D post effect.

- No-WebGL fallback: static scanline overlay, CSS filters, or offline raster export
- Slow-WebGL fallback: freeze noise and disable rolling or time-varying distortion

## Differentiation Guidance

Choose explicitly whether the target is VHS damage, CRT glass, broadcast bleed, or retro poster treatment. A clear art direction matters more than piling on all available artifacts.

## Conformance Cases

- `default-poster`: default params on a poster or still image
- `crt-bias`: higher `barrelWarp` and `scanlines`
- `frozen-frame`: animation disabled with fixed `seed`

## Public References

- [Three.js — ChromaticAberrationNode](https://threejs.org/docs/pages/ChromaticAberrationNode.html)
- [Shadertoy — VHS Tape Shader](https://www.shadertoy.com/view/sltBWM)
- [Lettier — Barrel Distortion](https://lettier.github.io/3d-game-shaders-for-beginners/barrel-distortion.html)
- [CRT shader references collection](https://github.com/libretro/glsl-shaders/tree/master/crt)
