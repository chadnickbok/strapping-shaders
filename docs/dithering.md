# Dithering

Dithering is a procedural monochrome study built around the specific stability problem Lucas Pope documented while developing *Return of the Obra Dinn*: once a low-resolution grayscale image is reduced to 1-bit, the threshold pattern has to move in a way that stays readable instead of "swimming" distractingly across the screen.

This implementation keeps the scene self-contained so the playground can stress that problem directly. The shader renders a low-resolution moving sphere scene first, then reduces it through a hybrid threshold pass with three modes:

- `digital`: screen-offset stabilization with crisp 1-bit output
- `analog`: sphere-mapped threshold coordinates with softer supersampled coverage
- `hero-detail`: digital-style output plus local-gather refinement for more inspectable sphere detail

## Visual Behavior

The default output should read as a stark ink-on-paper plate with a moving or rotating ball that remains mostly legible as the source shifts. Important regions should lean toward a structured Bayer pattern, while less critical regions use a more organic tiled threshold field. Analog mode should feel calmer in motion; Hero Detail should read denser and more engraved.

## High-Level Components

- low-resolution procedural source shading
- ordered 8x8 Bayer thresholds
- organic blue-noise-like tiled thresholds
- screen-offset and sphere-mapped coordinate stabilization
- local-gather refinement for hero detail

## Plausible Implementation

Render a scalar scene first at a coarser internal grid. Keep separate notions of luminance, importance, and edge emphasis. For the threshold pass, compute pattern coordinates from either a screen-space offset tied to camera swing or from a camera-centered spherical mapping. Mix Bayer and organic thresholds by importance, then optionally run a local neighborhood gather to push contrast in hero regions before the final binary decision.

This is intentionally a single-pass approximation of the public ideas Pope described, not a literal recreation of the game's shipping renderer or of Brent Werness's multi-pass refinement code.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| mode | select | `digital` | `digital`, `analog`, `hero-detail` | Chooses the stabilization / resolve strategy |
| pixelScale | number | 0.42 | `0..1` | Internal source resolution before thresholding |
| cameraSwing | number | 0.52 | `0..1` | Amount of pseudo camera rotation used for the stability demo |
| ballTravel | number | 0.58 | `0..1` | How much the sphere translates through the scene |
| ballSize | number | 0.6 | `0..1` | Radius of the moving sphere |
| heroBayerMix | number | 0.62 | `0..1` | How strongly important regions prefer the Bayer pattern |
| refinement | number | 0.45 | `0..1` | Strength of the hero-detail local gather |
| soften | number | 0.72 | `0..1` | Analog-mode softness after supersampled coverage |
| inkColor | color | `#0f0f0f` | any valid color | Monochrome ink tone |
| paperColor | color | `#efe8d5` | any valid color | Paper / phosphor tone |

## Sizing Behavior

The sphere scene is frame-relative. Resizing should preserve the sense of low-resolution shading and dithering density rather than reinterpreting the scene as a different composition.

## Motion Behavior

- Motion is part of the point of this effect.
- `animate=false` should freeze the current plate cleanly.
- Analog mode should feel the most comfortable under motion.
- With fixed inputs, `seed`, and `time`, output should be deterministic.

## Performance And Fallbacks

The base digital mode is cheap. Analog mode adds a small supersampling cost, and Hero Detail adds the largest cost because it gathers neighboring scene samples.

- No-WebGL fallback: prerendered monochrome poster frames or video
- Slow-WebGL fallback: reduce `pixelScale`, disable Hero Detail, and lower Analog softness

## Conformance Cases

- `digital-plate`: default digital preset at 1280x720
- `analog-sphere`: analog preset with active animation
- `hero-inspection`: hero-detail preset with higher Bayer mix and refinement

## Public References

- [Lucas Pope, TIGSource devlog, November 2017](https://dukope.com/devlogs/obra-dinn/tig-32/)
- [Lucas Pope, TIGSource devlog, June 2014](https://dukope.com/devlogs/obra-dinn/tig-01/)
- [Lucas Pope, TIGSource devlog, January 2016](https://dukope.com/devlogs/obra-dinn/tig-18/)
- [Robert Ulichney, A Review of Halftoning Techniques](https://cv.ulichney.com/papers/2000-halftoning-review.pdf)
- [Surma, Ditherpunk](https://surma.dev/things/ditherpunk/)
- [Christoph Peters, Free blue noise textures](https://momentsingraphics.de/BlueNoise.html)
