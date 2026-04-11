# Prism Refraction

Prism Refraction is a glass distortion treatment with chromatic separation. It should read as optical dispersion driven by refraction, not as arbitrary RGB offsets pasted on top of an image.

## Visual Behavior

The default output should bend the source image slightly and show color splitting strongest near edges or curvature changes. Higher `dispersion` should widen the color fringe. Higher `refraction` should deepen the bend. `edgeGlow` should reinforce the lens boundary without washing out the image.

## High-Level Components

- source-image sampling
- normal or thickness-derived refraction
- per-channel offset for dispersion
- rim highlight and halo

## Plausible Implementation

Compute a refraction offset from a normal field or thickness field, then sample the background multiple times with slightly different offsets for red, green, and blue. Add a restrained rim highlight and optional halo. The distinctiveness comes from tying the color split to refraction rather than adding a uniform chromatic aberration filter.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: preserve source alpha when relevant

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| refraction | number | 0.24 | `0..1` | Base lens bend amount |
| dispersion | number | 0.18 | `0..1` | RGB separation strength |
| edgeGlow | number | 0.16 | `0..1` | Rim light and halo intensity |
| softness | number | 0.08 | `0..1` | Softening of the lens edge |
| tint | color | `rgba(255,255,255,0.1)` | any valid color | Optional prism tint |
| lensScale | number | 0.42 | `0..1` | Size of the refractive region or internal normal features |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is content-aware. Resizing should preserve the relationship between the refractive feature, the RGB split, and the source image instead of scaling the color fringe disproportionately.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze any internal shimmer or drift.
- With fixed `seed`, source image, params, frame size, and `time`, output should be deterministic.

## Performance And Fallbacks

This stays practical because the incremental cost is only a few extra source samples.

- No-WebGL fallback: SVG displacement plus duplicated RGB offset layers
- Slow-WebGL fallback: use smaller dispersion and keep the color split near edges only

## Differentiation Guidance

Differentiate through dispersion curve, highlight style, and lens geometry. The effect should feel optical and intentional, not like a generic chromatic aberration slider.

## Conformance Cases

- `default-prism`: default params on a high-contrast source image
- `wide-split`: high `dispersion` with moderate `refraction`
- `still-lens`: animation disabled with fixed `seed`

## Public References

- [Three.js — MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Three.js — ChromaticAberrationNode](https://threejs.org/docs/pages/ChromaticAberrationNode.html)
- [GPU Gems 2 — Generic Refraction Simulation](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation)
- [Shadertoy — Simple chromatic aberration](https://www.shadertoy.com/view/ltByR3)
