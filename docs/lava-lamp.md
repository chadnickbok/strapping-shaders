# Lava Lamp

Lava Lamp is a metaball field with soft unions, separating blobs, and optional rim glow. The defining feature is the field merge itself, not just overlapping circles.

## Visual Behavior

The default output should show several soft blobs merging and separating with readable necks and union shapes. Higher `blobCount` increases complexity. Higher `softness` broadens the union. Higher `glow` should reinforce the silhouette rather than hiding the field transitions.

## High-Level Components

- scalar field accumulation
- metaball kernels
- iso-thresholded surface
- optional rim light or palette mapping

## Plausible Implementation

Sum radial kernels from several moving centers, threshold the scalar field into a visible surface, and use the field gradient for normals or rim light if needed. The effect remains practical in 2D as long as the blob count stays modest.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: may be transparent outside the blob field

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | color[] | three saturated colors | 2 to 5 colors | Interior ramp or blob accents |
| blobCount | number | 5 | `2..12` | Number of metaball centers |
| blobSize | number | 0.42 | `0..1` | Average blob radius |
| softness | number | 0.3 | `0..1` | Union softness and falloff |
| speed | number | 0.22 | `0..1` | Motion rate |
| glow | number | 0.18 | `0..1` | Rim or halo intensity |
| contrast | number | 0.4 | `0..1` | Interior separation and palette punch |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the feeling of several coherent blobs in a shared tank rather than turning the effect into a few giant circles.

## Motion Behavior

- Motion is optional but common.
- `animate=false` should freeze the field in a valid merged state.
- Fixed `seed`, params, frame size, and `time` should produce deterministic output.

## Performance And Fallbacks

Cost scales with blob count, so low-end modes should cut blob count before they alter the union behavior.

- No-WebGL fallback: SVG goo filters or a blur-plus-threshold Canvas pipeline
- Slow-WebGL fallback: reduce `blobCount` and disable extra glow

## Differentiation Guidance

Differentiate with motion law, kernel feel, palette, and presentation. The family is well known; the personality comes from whether it feels glossy, neon, flat, playful, or slow.

## Conformance Cases

- `default-blobs`: default params in a wide frame
- `dense-union`: high `blobCount` with high `softness`
- `frozen-lamp`: animation disabled with fixed `seed`

## Public References

- [James Blinn — A Generalization of Algebraic Surface Drawing](https://authors.library.caltech.edu/records/wyfs3-eqk14)
- [The Book of Shaders — shapes](https://thebookofshaders.com/07/)
- [Shadertoy — Neon Metaballs](https://www.shadertoy.com/view/tdS3zK)
