# Contours

Contours is a topographic isoline shader built from a broad pseudo-terrain field. The effect should feel map-like and structured rather than noisy.

## Visual Behavior

The default output should show contour lines that follow a readable terrain basis with clear major and minor cadence. Higher `terrainScale` should create larger landforms. Smaller `contourSpacing` should increase line frequency. Increasing `drift` should move the terrain slowly without making the lines jitter.

## High-Level Components

- terrain-like scalar field
- repeated band selection with `fract`
- antialiased contour extraction
- major/minor line styling
- cartographic color treatment

## Plausible Implementation

Generate a height field using fBM, ridge noise, or a related terrain basis. Turn it into repeated contour bands with `fract(height * frequency)`, then isolate thin windows using `smoothstep` and `fwidth()`. If vector contour extraction is ever needed later, marching squares is the public path, but a shader-only background does not require it.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| terrainScale | number | 0.45 | `0..1` | Size of the underlying landform field |
| contourSpacing | number | 0.35 | `0..1` | Density of contour levels |
| lineWidth | number | 0.2 | `0..1` | Thickness of contour strokes |
| majorEvery | number | 5 | `2..10` | Cadence for emphasized contour lines |
| drift | number | 0.08 | `0..1` | Slow field movement |
| lineColor | color | `#1d2a35` | any valid color | Contour ink color |
| backgroundColor | color | `#ece7dc` | any valid color | Base paper or map tone |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the sense of terrain scale and contour cadence rather than reinterpreting the field as a different terrain type.

## Motion Behavior

- Motion is optional and should stay restrained.
- `animate=false` should leave a stable topographic plate.
- With fixed inputs, `seed`, and `time`, output should be deterministic.

## Performance And Fallbacks

The shader-only version is cheap. The main variable cost is the number of noise octaves and contour levels.

- No-WebGL fallback: precomputed SVG contours or a raster contour image
- Slow-WebGL fallback: reduce octaves and contour density before changing line semantics

## Differentiation Guidance

Differentiate with terrain basis, cartographic styling, and major/minor rhythm. The goal is not to mimic any specific map renderer.

## Conformance Cases

- `default-map`: default params in a 1440x900 frame
- `dense-isolines`: small `contourSpacing` with thin `lineWidth`
- `still-plate`: animation disabled with fixed `seed`

## Public References

- [The Book of Shaders — fBM](https://thebookofshaders.com/13/)
- [The Book of Shaders — noise](https://thebookofshaders.com/11/)
- [Evan Wallace — screen-space derivative antialiasing](https://madebyevan.com/shaders/grid/)
- [Shadertoy — Contour lines](https://www.shadertoy.com/view/lltBWM)
