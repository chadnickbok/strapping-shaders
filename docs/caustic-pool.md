# Caustic Pool

Caustic Pool is an image-first swimming-pool floor treatment. It should read as a source image sitting beneath shallow water with bright projected caustics on top, not as a physical caustics demo, a noisy procedural substrate, or a flat blue wash.

## Visual Behavior

The default output should keep the source image readable while making it feel clearly submerged through visible liquid lensing, underwater softening, and a clean white caustic lattice. Higher `distortion` should create stronger local bending and lens pockets on the source image, not a more turbulent caustic web. Higher `caustic` should brighten the projected light network. Higher `size` should zoom the caustic pattern larger, and values above `1` should continue pushing into bigger slower-feeling cells instead of capping out. Higher `openness` should create larger dark gaps and reduce stacked web fill. Higher `waves` should carry the shared water motion and caustic agitation. Higher `depth` should make the image feel farther below the water surface through stronger tinting, blur, and displacement.

## High-Level Components

- source-image pool-floor sampling
- shared low-frequency water motion
- smooth floor-image refraction and underwater softening
- Voronoi-derived caustic ridges and junctions
- restrained halo lift around the brightest caustics
- quiet plaster-like fallback floor when no image is bound

## Plausible Implementation

Drive both the floor-image warp and the caustic advection from the same broad water field. Use that field to displace and softly blur the source image so it feels submerged, then layer a separate high-frequency Voronoi ridge network over the result as projected caustic light. Avoid procedural texture in the darker regions so the image itself remains the floor.

## Inputs

- Input type: procedural, with an optional image-backed floor
- Asset bindings:
  - `sourceImage` optional image for the pool floor
- Alpha: opaque

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| waterTint | color | `#97d7e6` | hex color | Water transmission tint |
| lightTint | color | `#fffdf7` | hex color | Bright caustic highlight tint |
| layerMix | number | `0.72` | `0..1` | Overall strength of the water treatment and caustic overlay |
| distortion | number | `0.58` | `0..1` | Strength of the broad floor-image warp and local lensing without increasing caustic turbulence |
| waves | number | `0.58` | `0..1` | Energy in the shared macro water field |
| caustic | number | `0.76` | `0..1` | Brightness of the caustic lattice |
| size | number | `0.42` | `0..3` | Caustic zoom, with values above `1` pushing into larger zoomed caustics |
| openness | number | `0.18` | `0..1` | Opens larger dark gaps and reduces stacked secondary caustic fill |
| speed | number | `0.32` | `0..1` | Shared motion rate for water and caustics |
| depth | number | `0.52` | `0..1` | Water-depth feel, tinting, blur, and displacement scale |
| halo | number | `0.18` | `0..1` | Soft lift around the brightest caustics |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the relationship between broad image refraction and the finer caustic lattice instead of turning the result into a different kind of texture.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze both the water warp and the caustic motion.
- `speed=0` should keep the result visually static even when `animate=true`.
- Fixed `seed`, frame size, params, asset bindings, and `time` should produce deterministic output.

## Performance And Fallbacks

The effect stays single-pass. The main cost is extra image sampling plus the procedural caustic field.

- Current runtime behavior: if WebGL2 is unavailable, `EffectCanvas` reports a runtime error. There is no built-in still or loop fallback in the current implementation.
- Potential optimization path: reduce blur taps, weaken halo, and lower the effective caustic density before changing the overall look

## Differentiation Guidance

Differentiate with the balance between image readability, water motion, and caustic sharpness. This effect should not regress into a noisy procedural background or a heavily stylized crackle field. The negative space between caustic lines should stay quiet.

## Shipped Presets And Validation Cases

- `default`: definition defaults on the bundled sample floor image
- `sun-shelf`: brighter white caustics with shallower water feel
- `gallery-pool`: calmer editorial pool-floor treatment with deeper transmission
- `still-pool`: `speed=0` with a fixed `seed`; this behavior is covered by tests but is not currently shipped as a preset JSON

## Public References

- [GPU Gems Chapter 2, Rendering Water Caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics)
- [Steven Worley, A Cellular Texture Basis Function](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf)
- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [The Book of Shaders — Fractal Brownian Motion](https://thebookofshaders.com/13/)
