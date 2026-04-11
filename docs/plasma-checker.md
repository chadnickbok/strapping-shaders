# Plasma Checker

Plasma Checker is a warped periodic pattern that keeps one foot in geometry and one foot in psychedelic flow. The point is the tension between an orderly checker or stripe basis and a fluid distortion field.

## Visual Behavior

The default output should still hint at checks or stripes beneath the distortion. Higher `gridScale` should increase the number of cells. Higher `warp` should melt the geometry further. Higher `softness` should soften the transitions without removing the underlying periodic read.

## High-Level Components

- checker or stripe basis
- vector-valued domain warp
- palette mapping
- contrast shaping
- optional animated drift

## Plausible Implementation

Generate a simple periodic basis in UV space, then domain-warp it with fBM or another vector field. Palette-map the resulting scalar or combine a few warped bases for richer structure. This is a standard domain-warped pattern shader and remains very practical in one pass.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | color[] | three saturated colors | 2 to 5 colors | Color ramp for the warped pattern |
| gridScale | number | 0.42 | `0..1` | Size of the underlying checks or stripes |
| warp | number | 0.48 | `0..1` | Distortion strength |
| contrast | number | 0.52 | `0..1` | Pattern separation |
| softness | number | 0.18 | `0..1` | Edge smoothing between regions |
| speed | number | 0.2 | `0..1` | Animation rate |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the relationship between the periodic basis and the warp field rather than turning the pattern into a few oversized stripes.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the distortion cleanly.
- Fixed params, frame size, `seed`, and `time` should yield deterministic output.

## Performance And Fallbacks

This is practical as a single-pass shader. The main cost is the warp field.

- No-WebGL fallback: static pattern with SVG displacement or offline raster export
- Slow-WebGL fallback: reduce warp octaves and freeze animation before changing the basis pattern

## Differentiation Guidance

Differentiate with checker-vs-stripe balance, palette, warp scale, and whether the result feels like crisp geometry under stress or a fully melted plasma field.

## Conformance Cases

- `default-checker`: default params in a wide frame
- `melted-grid`: high `warp` with moderate `contrast`
- `still-pattern`: animation disabled with fixed `seed`

## Public References

- [Dave Pagurek — shader domain warping](https://www.davepagurek.com/programming/shader-domain-warping/)
- [The Book of Shaders — patterns](https://thebookofshaders.com/09/)
- [The Book of Shaders — fBM](https://thebookofshaders.com/13/)
- [Shadertoy — Warped Checkerboard](https://www.shadertoy.com/view/3fGXDR)
