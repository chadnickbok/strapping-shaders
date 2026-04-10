# Aurora

Aurora is a procedural background built from broad atmospheric ribbons, low-frequency warping, and restrained highlight shaping. The effect should read as layered color bands first and subtle internal variation second.

This spec corresponds to the current `aurora-field` runtime family.

## Visual Behavior

The default image should show overlapping color bands with soft edges, moderate contrast, and clean gradients. Lower `density` should create wider, calmer ribbons. Higher `density` should create tighter, more frequent bands. Higher `flow` should increase both drift and bend, so the field feels more animated and more curved at the same time. Highlight shaping should support the composition without turning the frame into a uniform bloom wash.

## High-Level Components

- palette-mapped ribbon field
- two low-frequency fBM warp fields
- in-shader highlight shaping and vignette

## Plausible Implementation

Build a vertically biased ribbon scalar field, warp it with two low-frequency fBM samples taken in different directions, map the result through an ordered 3 to 6 color palette, then add restrained highlight shaping and vignette. The look is closer to an art-directed atmospheric gradient field than a physically modeled aurora.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: intended as an opaque background by default, but `opacity` still sets the fragment alpha output

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | color[] | four cool-to-warm colors | 3 to 6 colors | Ordered ramp used across the field |
| density | number | 0.45 | `0..1` | Controls ribbon packing, field scale, and overall band frequency |
| flow | number | 0.5 | `0..1` | Couples animation rate with warp amplitude |
| contrast | number | 0.55 | `0..1` | Controls highlight emphasis and color separation from gray |
| opacity | number | 1 | `0..1` | Final alpha |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the overall character of the ribbon field rather than stretching a single band pattern. Very wide frames should still read as layered ribbons, not as evenly spaced stripes.

## Motion Behavior

- Motion is optional and comes from the shared runtime `animate` and `time` props rather than an Aurora-specific parameter.
- `animate=false` should freeze the field without collapsing the composition.
- With a fixed `seed` and explicit `time`, output should be deterministic.
- `flow` controls both drift rate and bend amount, so the effect does not currently expose those dimensions independently.

## Performance And Fallbacks

The base look is practical as a single pass. The expensive part is the repeated fBM work that shapes the ribbons and highlights.

Current runtime behavior:

- Shared `quality` settings primarily reduce render scale

- No-WebGL fallback: layered CSS or SVG gradients with blur and subtle animated drift
- Future slow-WebGL fallback: reduce fBM octave count or warp complexity before changing the ribbon structure

## Differentiation Guidance

Differentiate through palette logic, band spacing, altitude bias, and motion profile. Avoid making the effect distinct only through copied palettes or literal sky simulation.

## Conformance Cases

- `default-hero`: default params in a 1440x900 frame
- `dense-ribbons`: high `density` with moderate-high `contrast`
- `paused-state`: animation disabled with fixed `seed` and `time`

## Public References

Technique references:

- [The Book of Shaders — Shaping Functions](https://thebookofshaders.com/05/)
- [The Book of Shaders — Colors](https://thebookofshaders.com/06/)
- [The Book of Shaders — fBM](https://thebookofshaders.com/13/)
- [Ken Perlin — Improving Noise](https://opengl.org.ru/ext/mrl.cs.nyu.edu/perlin/paper445.pdf)

Visual references only:

- [Alex Harri — A flowing WebGL gradient, deconstructed](https://alexharri.com/blog/webgl-gradients)
- [Shadertoy — Auroras](https://www.shadertoy.com/view/XtGGRt)
