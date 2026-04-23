# Soap Film Interference

Soap Film Interference is a thin-film iridescence treatment for coated surfaces, bubbles, and magical material overlays. It should read as angle-dependent color travel over a translucent body, not as a rainbow gradient painted directly on top.

This spec corresponds to the current `soap-film-interference` runtime family.

## Visual Behavior

The default output should feel airy and expensive. The hue shift should intensify toward glancing angles, while the center remains more transmissive. Increasing `thickness` should change the interference pattern rather than simply brightening the effect. Increasing `distortion` should introduce thickness variation and local wobble without turning the film into liquid distortion.

## High-Level Components

- thin-film inspired spectral shift
- Fresnel weighting
- local thickness variation
- optional source-image underlay
- translucent body tint

## Plausible Implementation

Approximate a thin-film phase term from a stylized surface normal and a thickness field, convert that phase into RGB interference colors, then blend it with a neutral underlay using Fresnel-driven reflectance. The implementation can stay deliberately 2D and art-directed as long as hue travel remains angle-dependent and thickness variation feels material rather than decorative.

## Inputs

- Input type: optional image
- Asset bindings: optional `sourceImage`
- Alpha: translucent output is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| baseTint | color | `#dfe7f3` | any valid color | Neutral body tint under the film colors |
| thickness | number | `0.54` | `0..1` | Mean film thickness |
| iridescence | number | `0.74` | `0..1` | Strength of the angle-driven hue shift |
| fresnel | number | `0.58` | `0..1` | Edge reflectance emphasis |
| distortion | number | `0.3` | `0..1` | Thickness variation / wobble |
| drift | number | `0.28` | `0..1` | Animation speed of the thickness field |
| opacity | number | `0.82` | `0..1` | Overall film opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the scale of the thickness variation so the material still reads like a delicate film rather than a coarse marbled coating.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the thickness field and interference pattern cleanly.
- With a fixed `seed`, image, frame size, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

This family is lightweight compared with full PBR iridescence because it stays in a single 2D pass.

- No-WebGL fallback: static iridescent gradient overlay with a Fresnel-like edge mask
- Slow-WebGL fallback: reduce the thickness variation before changing the Fresnel read

## Differentiation Guidance

Differentiate through body tint, interference smoothness, and how much the effect behaves like a delicate coating versus a floating bubble membrane. Avoid flattening it into a simple holographic foil treatment.

## Conformance Cases

- `default-film`: default params on a neutral card
- `bubble-sheet`: stronger `iridescence` and `distortion`
- `still-coating`: animation disabled with a fixed `seed`

## Public References

- [Belcour and Barla - A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence](https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html)
- [Hirayama et al. - Rendering Iridescent Colors Appearing on Natural Objects](https://home.hiroshima-u.ac.jp/~kin/publications/PG00/iridescent_colors.pdf)
- [Three.js - MeshPhysicalMaterial iridescence](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Three.js - MeshPhysicalNodeMaterial iridescence thickness](https://threejs.org/docs/pages/MeshPhysicalNodeMaterial.html)
