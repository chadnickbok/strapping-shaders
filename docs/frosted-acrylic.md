# Frosted Acrylic

Frosted Acrylic is a mature glassmorphism surface: blurred transmission, restrained refraction, soft tint, and a clear sense of material thickness around the edges. It should feel like an engineered translucent panel rather than a generic blur card.

This spec corresponds to the current `frosted-acrylic` runtime family.

## Visual Behavior

The default output should blur the background enough to feel diffusive while still preserving broad image structure. Increasing `blur` should soften transmission without destroying all legibility too early. Increasing `thickness` and `edgeGlow` should strengthen the acrylic edge read rather than making the whole frame glow evenly.

## High-Level Components

- source-image transmission
- roughness-driven blur
- local UV refraction
- edge bevel / thickness highlight
- subtle body tint

## Plausible Implementation

Capture or bind a background image, perturb the sample coordinates with a restrained normal field, then sample that image through an isotropic blur kernel. Mix in a soft body tint and a separate edge highlight term so the surface reads as a thick acrylic pane rather than a purely optical distortion.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: transparent output is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| blur | number | `0.46` | `0..1` | Transmission blur amount |
| distortion | number | `0.18` | `0..1` | Small-scale surface waviness |
| refraction | number | `0.26` | `0..1` | Strength of the bend through the panel |
| thickness | number | `0.44` | `0..1` | Edge build-up / bevel presence |
| edgeGlow | number | `0.48` | `0..1` | Bright acrylic edge catch light |
| tint | color | `#e8f2ff` | any valid color | Body tint of the material |
| opacity | number | `0.92` | `0..1` | Overall pane opacity |

## Sizing Behavior

The effect depends on the bound image, but the pane itself is frame-relative. Resizing should preserve the relationship between edge thickness, blur radius, and refraction strength.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the distortion field cleanly.
- With a fixed `seed`, frame size, image, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

The main cost is the multi-tap transmission blur. Refraction and edge terms are secondary.

- No-WebGL fallback: CSS `backdrop-filter` or a prerendered blurred image with a tinted overlay
- Slow-WebGL fallback: reduce taps before weakening the edge-thickness read

## Differentiation Guidance

Differentiate through diffusion level, tint, and edge behavior. This family should feel like acrylic or frosted glass, not like liquid distortion, a prism lens, or a fully clear glossy pane.

## Conformance Cases

- `default-pane`: default params over a sample photo
- `display-plaque`: higher `thickness` with restrained `refraction`
- `mist-panel`: stronger `blur` and softer edges

## Public References

- [GPU Gems 2 - Generic Refraction Simulation](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation)
- [Three.js - MeshPhysicalMaterial transmission](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Codrops - Creating the Effect of Transparent Glass and Plastic in Three.js](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/)
- [SBCode - Glass Transmission](https://sbcode.net/threejs/glass-transmission/)
