# Voronoi Caustics

Voronoi Caustics is a stylized cellular light-web effect built from warped Voronoi ridges. It should read as decorative or cartoon-like caustic lighting, not as a literal refraction model of a pool surface.

## Visual Behavior

The default output should show a bright cellular ridge network over a calmer water-tinted substrate. Higher `scale` should tighten the cell structure. Higher `lineWidth` should make the ridges fuller and more web-like. Higher `contrast` should sharpen the separation between the bright lattice and the quieter gaps without changing the overall cell frequency.

## High-Level Components

- Voronoi or Worley cellular basis
- ridge extraction from cellular distance differences
- low-frequency domain warp
- separate contrast and line-width shaping
- restrained halo lift around the brightest ridges

## Plausible Implementation

Build one or more warped Voronoi fields, extract a ridge metric from the distance gap between neighboring cells, then shape that metric into a stylized light web. A second cellular field can break up the main lattice, but it should not overpower the quieter regions between bright ridges.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: opaque

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| waterTint | color | `#7cc7df` | any valid color | Base substrate tint |
| lightTint | color | `#f7fbff` | any valid color | Ridge and halo tint |
| scale | number | `0.42` | `0..1` | Cell density / apparent feature scale |
| lineWidth | number | `0.44` | `0..1` | Ridge thickness |
| contrast | number | `0.62` | `0..1` | Ridge brightness shaping |
| distortion | number | `0.3` | `0..1` | Domain warp amount |
| driftSpeed | number | `0.22` | `0..1` | Animation rate |
| halo | number | `0.14` | `0..1` | Soft fill around the brighter ridges |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the apparent cell packing and the balance between bright ridges and quiet substrate instead of stretching the pattern into larger blobs.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the cellular web and the warped substrate.
- Fixed `seed`, frame size, params, and `time` should produce deterministic output.

## Performance And Fallbacks

This effect should remain single-pass and procedural.

- No-WebGL fallback: static SVG or pre-rendered loop
- Slow-WebGL fallback: reduce secondary field detail and halo

## Differentiation Guidance

Differentiate with the cell scale, the amount of domain warp, and how quiet the darker gaps remain. The effect should be open about its cellular lineage instead of pretending to be a literal water-refraction model.

## Conformance Cases

- `default-web`: default params in a wide hero frame
- `bright-lattice`: higher contrast with narrower ridges
- `quiet-web`: lower contrast with calmer drift

## Public References

- [Steven Worley, A Cellular Texture Basis Function](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf)
- [Jing Liao et al., Procedural modeling of water caustics and foamy water for cartoon animation](https://link.springer.com/content/pdf/10.1631/jzus.C1000228.pdf)
