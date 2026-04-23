# Flowing Gradient

Flowing Gradient is a soft, layered gradient surface built from drifting noise fields and broad wave masks. It should read as a designed motion surface rather than as clouds, plasma, or aurora ribbons.

This spec corresponds to the current `flowing-gradient` runtime family.

## Visual Behavior

The default output should feel broad and atmospheric. Color should be driven by a smooth lightness field, while the main shape comes from two large noisy wave boundaries that sweep across the frame. Increasing `flow` should speed up the lateral drift without making the motion jittery. Increasing `softness` should widen the transition between the wave layers.

## High-Level Components

- palette-mapped lightness field
- stacked drifting noise layers
- two noisy horizontal wave masks
- subtle finish grain

## Plausible Implementation

Build a background lightness field from layered animated noise, then compute two separate wave boundaries whose positions drift over time. Use the wave masks to crossfade between multiple lightness fields and map the result through a palette ramp. The runtime does not need to reproduce the source article exactly as long as it preserves the broad wave layering, directional flow, and gradient-mapped finish.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | palette | `["#1d1736", "#52307c", "#c76e2a", "#f4d37b"]` | `3..6` colors | Ordered ramp used to color the lightness field |
| flow | number | `0.42` | `0..1` | Overall drift speed |
| waveHeight | number | `0.54` | `0..1` | Amplitude of the two main wave boundaries |
| separation | number | `0.52` | `0..1` | Vertical spacing between the wave layers |
| softness | number | `0.58` | `0..1` | Edge softness of the wave transitions |
| contrast | number | `0.44` | `0..1` | Compresses or expands palette contrast |
| grain | number | `0.08` | `0..1` | Final finish grain |
| opacity | number | `1` | `0..1` | Overall opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the feeling of long horizontal bands and broad color sweeps rather than changing the composition into a tighter texture.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the drifting noise and wave masks cleanly.
- With a fixed `seed`, frame size, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

This family is single-pass and procedural. The main cost comes from stacked noise calls, not from asset sampling.

- No-WebGL fallback: layered CSS gradients with a slow mask translation
- Slow-WebGL fallback: simplify the stacked noise before changing the wave semantics

## Differentiation Guidance

Differentiate through palette character, wave spacing, blur softness, and flow cadence. This family should stay closer to editorial motion graphics than to volumetric sky, lava, or liquid materials.

## Conformance Cases

- `default-surface`: default params on a 1440x900 frame
- `warm-tide`: broader wave masks with a slower drift
- `still-gradient`: animation disabled with a fixed `seed`

## Public References

- [Alex Harri - A flowing WebGL gradient, deconstructed](https://alexharri.com/blog/webgl-gradients?utm_source=chatgpt.com)
- [Alex Harri - reference shader source](https://github.com/alexharri/website/blob/eb9551dd73126857045035b378b194dbf923c675/src/components/WebGLShader/shaders/fragment/final.ts)
- [Wikipedia - Simplex noise](https://en.wikipedia.org/wiki/Simplex_noise)
- [The Book of Shaders - Noise](https://thebookofshaders.com/11/)
