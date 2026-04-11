# Velvet Mesh

Velvet Mesh is a soft mesh-gradient surface with tactile grain and a restrained vignette. It should feel like a luxury color field rather than a loud generative effect.

## Visual Behavior

The default output should have smooth palette transitions, broad control-point influence, and just enough grain to add texture without taking over the image. Higher `pointSpread` should create broader, cloudier color fields. Higher `drift` should animate the field slowly without turning it into a liquid warp.

## High-Level Components

- radial or inverse-distance color interpolation
- small set of control points
- light low-frequency drift
- grain overlay
- vignette and contrast shaping

## Plausible Implementation

Blend a handful of color control points using radial falloff, inverse-distance weighting, or a mesh-gradient-like field. Apply a subtle low-frequency warp or control-point drift. Finish with monochrome grain and a mild vignette. This is well supported by public mesh-gradient tools and shader gradient studies.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | color[] | four editorial colors | 3 to 6 colors | Colors assigned to gradient control points |
| pointSpread | number | 0.55 | `0..1` | Radius and blend softness of the color field |
| drift | number | 0.18 | `0..1` | Slow control-point or field movement |
| grain | number | 0.12 | `0..1` | Surface texture amount |
| vignette | number | 0.1 | `0..1` | Edge darkening |
| contrast | number | 0.4 | `0..1` | Separation between color masses |
| opacity | number | 1 | `0..1` | Overall output opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the impression of large soft fields instead of making the gradient feel tiled or noisy.

## Motion Behavior

- Motion is optional and should stay slow by default.
- `animate=false` should leave a stable static field.
- With fixed params, frame size, `seed`, and `time`, output should be deterministic.

## Performance And Fallbacks

This is one of the cheaper catalog entries unless the implementation uses expensive noise textures.

- No-WebGL fallback: CSS gradients with a transparent grain overlay
- Slow-WebGL fallback: freeze drift and keep only the static field, grain, and vignette

## Differentiation Guidance

Differentiate with palette defaults, point arrangement, finish, and contrast. The effect should feel like a material surface or art direction choice, not just a generic colorful blur.

## Conformance Cases

- `default-surface`: default params in a 1200x800 frame
- `editorial-contrast`: high `contrast` with low `grain`
- `static-poster`: animation disabled with fixed palette

## Public References

- [MESH gradient tool](https://meshgradient.com/)
- [Alex Harri — WebGL gradients](https://alexharri.com/blog/webgl-gradients)
- [The Book of Shaders — color](https://thebookofshaders.com/06/)
- [Three.js examples](https://threejs.org/examples/)
