# Holographic Foil

Holographic Foil is an iridescent metallic surface treatment with angle-driven color shifts, surface scratches, and restrained sparkle. The core read is view-dependent color motion.

## Visual Behavior

The default output should behave like foil or coated sticker stock: hue shifts should move across the surface as lighting or viewing angle changes, while scratches and flakes stay secondary. Higher `iridescence` should widen the hue travel. Higher `scratch` should add structure without turning the effect into obvious noise.

## High-Level Components

- angle-dependent hue ramp
- Fresnel weighting
- thin-film inspired iridescence
- scratch or flake noise
- optional image underlay

## Plausible Implementation

Use a stylized thin-film or angle-based hue ramp, layer in Fresnel reflectance, and break the surface with scratch or flake noise. A physically exact BRDF is not required for this catalog; a disciplined 2D approximation is enough if it preserves the angle-dependent read.

## Inputs

- Input type: optional image
- Asset bindings: optional `sourceImage`
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| baseTint | color | `#d9d9e6` | any valid color | Base metallic tone under iridescence |
| iridescence | number | 0.65 | `0..1` | Hue-shift strength |
| fresnel | number | 0.5 | `0..1` | Edge reflectance emphasis |
| scratch | number | 0.18 | `0..1` | Micro-scratch visibility |
| sparkle | number | 0.12 | `0..1` | Sparse glitter or flake intensity |
| rotationDeg | number | 28 | `0..180` | Dominant scratch or streak direction |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the scale of scratches and foil grain so the surface still feels like coated stock rather than brushed metal siding.

## Motion Behavior

- Motion is optional.
- `animate=false` should keep a valid static foil finish.
- If animation is driven by `time`, the same params, frame size, `seed`, and `time` should produce deterministic output.

## Performance And Fallbacks

The effect can stay lightweight in 2D because it does not require full environment sampling.

- No-WebGL fallback: animated rainbow gradient overlay with masked noise
- Slow-WebGL fallback: keep the hue shift and drop secondary sparkle layers

## Differentiation Guidance

Differentiate through interference curve, scratch direction, foil grain, and restraint. Decide whether the material feels like sticker foil, card foil, or a more industrial holographic laminate.

## Conformance Cases

- `default-foil`: default params on a rectangular swatch
- `flashy-card`: high `iridescence` with low `scratch`
- `static-sticker`: animation disabled with fixed `seed`

## Public References

- [Belcour and Barla — thin-film iridescence](https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html)
- [Three.js — MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Godot Shaders — holographic card foil effect](https://godotshaders.com/shader/simple-dynamic-holographic-card-effect-foil/?utm_source=chatgpt.com)
