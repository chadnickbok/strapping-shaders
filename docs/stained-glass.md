# Stained Glass

Stained Glass is a mosaic image treatment built from segmented panes, dark lead lines, and optional bevel lighting. It should read as colored glass pieces joined by came, not as a generic cell filter.

## Visual Behavior

The default output should show clearly bounded panes with representative source colors and dark lead between them. Higher `cellSize` should produce larger panes. Higher `leadWidth` should thicken the came. Higher `bevel` should make the panes catch light without turning them metallic or glossy.

## High-Level Components

- Voronoi segmentation
- representative per-cell color sampling
- border distance for lead lines
- bevel lighting from distance gradients

## Plausible Implementation

Use Voronoi cells for segmentation, sample a representative color per cell, and render borders from distance to the nearest cell edge. Add a small bevel term from the distance gradient if needed. Dense, edge-aware segmentation can be a later enhancement, but the base catalog spec only needs a readable stained-glass treatment.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: output is normally opaque

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| cellSize | number | 0.35 | `0..1` | Average pane size |
| leadWidth | number | 0.16 | `0..1` | Thickness of the dark came lines |
| irregularity | number | 0.22 | `0..1` | Variation in pane shape and spacing |
| colorSnap | number | 0.28 | `0..1` | Pulls pane colors toward flatter representative values |
| bevel | number | 0.2 | `0..1` | Pane edge lighting |
| leadColor | color | `#2b241c` | any valid color | Color of the came lines |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is content-aware. Resizing should preserve the sense of pane scale and lead width instead of turning the image into a few giant cells or an overly fine mosaic.

## Motion Behavior

- Motion is normally disabled.
- `animate=false` should be the natural default.
- If later versions add subtle light drift, fixed `seed` and `time` should remain deterministic.

## Performance And Fallbacks

Moderate cell counts are practical. Very dense or edge-aware variants may be better precomputed.

- No-WebGL fallback: CPU-generated Voronoi polygons exported as SVG or raster
- Slow-WebGL fallback: reduce cell count and disable bevel

## Differentiation Guidance

Differentiate with seed distribution, pane geometry, lead styling, and color sampling. Decide whether the result feels handcrafted and angular or smoother and more decorative.

## Conformance Cases

- `default-mosaic`: default params on a portrait or poster image
- `heavy-lead`: high `leadWidth` with low `bevel`
- `static-pane`: fixed source with no motion

## Public References

- [Swarthmore — stained glass image processing paper](https://www.cs.swarthmore.edu/~adanner/cs97/s08/papers/gorbach.pdf)
- [Steven Worley — A Cellular Texture Basis Function](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf)
- [Shadertoy — Voronoi Mosaic](https://www.shadertoy.com/view/Wts3Dr)
