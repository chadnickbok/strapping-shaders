# Liquid Distortion

Liquid Distortion is an animated refractive image treatment that bends a source image with a procedural distortion field. It should read as liquid lensing rather than as a static pane material.

This spec lines up with the current `liquid-distortion` runtime family.

## Visual Behavior

The default output should show smooth local displacement, mild directional softening, a subtle interior glint, and stable borders. Increasing `distortion` should exaggerate the warp. Increasing `blur` should soften detail without making the source unreadable too early. Higher `edgeStability` should keep more of the border calm while the center remains active.

## High-Level Components

- source-image sampling
- animated UV distortion from a procedural noise field
- soft directional blur
- subtle interior highlight glint
- border stabilization

## Plausible Implementation

Bind a source image, perturb its sample coordinates with an fBM-driven distortion field, and add a restrained multi-tap blur plus mild chromatic separation. A separate interior highlight layer can add glint without turning the effect into rim lighting or a broad glass-material family.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: preserve source alpha when present

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| distortion | number | 0.3 | `0..1` | Overall warp intensity |
| refraction | number | 0.35 | `0..1` | Strength of lens-like bending and mild chromatic split |
| blur | number | 0.08 | `0..1` | Multi-tap sample softening |
| motion | number | 0.38 | `0..1` | Animation speed for the procedural field |
| featureSize | number | 0.5 | `0..1` | Size of the distortion features |
| edgeStability | number | 0.1 | `0..1` | Keeps the border calmer and more stable |
| highlight | number | 0.35 | `0..1` | Strength of the interior glint layer |

## Sizing Behavior

The effect depends on the bound image, but the distortion field is frame-local. Resizing should keep the relationship between image content and the distortion field coherent rather than stretching the field independently from the asset.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the procedural field and highlight movement.
- `motion=0` should keep the result visually static even when `animate=true`.
- With a fixed `seed` and explicit `time`, output should be deterministic.

## Performance And Fallbacks

The main cost is extra sampling. Blur and secondary refraction taps should be the first things to simplify.

- No-WebGL fallback: CSS `backdrop-filter`, SVG displacement, or a static filtered image
- Slow-WebGL fallback: lower DPR, reduce `blur`, and weaken secondary chromatic/refraction taps

## Differentiation Guidance

Differentiate with distortion cadence, feature size, highlight behavior, and how calm or active the borders feel. This family should stay focused on animated liquid-like image distortion, not on frosted glass, pane tinting, or static material rendering.

## Conformance Cases

- `default-distortion`: default params on a medium photo
- `strong-lens`: high `distortion` with moderate `edgeStability`
- `still-frame`: `motion=0` with a fixed `seed`

## Public References

Technique lineage:

- [GPU Gems 2 — Generic Refraction Simulation](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation)
- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [The Book of Shaders — Fractal Brownian Motion](https://thebookofshaders.com/13/)
- [Lettier — Screen Space Refraction](https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-refraction.html)

Implementation and tradeoffs:

- [Froyok — Refracting Pixels](https://www.froyok.fr/blog/2024-12-refraction/)

Visual inspiration:

- general refractive liquid-lensing and distortion treatments
- translucent UI material experiments
- heat haze and distortion-filter references
