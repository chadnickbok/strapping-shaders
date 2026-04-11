# Ink Bleed

Ink Bleed is a print-and-paper treatment for stamped marks, logos, and poster art. The effect should show absorbent paper spread, darker pooled regions, and edge breakup that feels printed rather than digitally distressed.

## Visual Behavior

The default output should preserve the source silhouette while softening edges and introducing paper-driven irregularity. Higher `spread` should widen the bleed. Higher `breakup` should erode clean edges. Higher `pooling` should darken dense regions more than thin areas.

## High-Level Components

- source thresholding
- blur and spread
- morphology or edge perturbation
- paper texture modulation
- pooled ink darkening

## Plausible Implementation

Start from a thresholded or high-contrast source image, apply a small blur to simulate spread, then perturb the edge with morphology and noise. Modulate with a paper texture and darken dense regions so the result feels deposited into paper rather than simply blurred.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: output is typically opaque over a paper base

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| threshold | number | 0.5 | `0..1` | Controls how the source collapses into inked regions |
| spread | number | 0.12 | `0..1` | Edge bleed amount |
| breakup | number | 0.18 | `0..1` | Distress and edge irregularity |
| pooling | number | 0.16 | `0..1` | Darkening in dense areas |
| paperTexture | number | 0.2 | `0..1` | Degree of paper-driven modulation |
| inkColor | color | `#2a221c` | any valid color | Primary ink color |
| paperTone | color | `#f0e8da` | any valid color | Base paper color |

## Sizing Behavior

The effect is content-aware. Resizing should preserve the sense of paper absorbency and edge softness rather than turning the source into a uniformly blurred mask.

## Motion Behavior

- Motion is normally disabled.
- `animate=false` should be the natural default.
- If later versions add subtle paper flutter or drying changes, fixed `seed` and `time` should remain deterministic.

## Performance And Fallbacks

This is often better as an offscreen bake step than as a giant live fullscreen shader.

- No-WebGL fallback: SVG filters, CPU image pipeline, or offline raster export
- Slow-WebGL fallback: bake bleed and paper interaction once, then sample the result

## Differentiation Guidance

Differentiate through paper model, pooling amount, and whether the result reads as stamp, over-inked poster, or screenprint distress.

## Conformance Cases

- `default-stamp`: default params on a logo or bold graphic
- `heavy-bleed`: high `spread` with moderate `pooling`
- `static-printmark`: no motion, fixed source, fixed paper tone

## Public References

- [MathWorks — morphological dilation and erosion](https://www.mathworks.com/help/images/morphological-dilation-and-erosion.html)
- [YouTube — Gaussian blur ink bleed tutorial](https://www.youtube.com/watch?v=_hDplhcd2v0)
- [MDPI Sensors — procedural texture survey](https://www.mdpi.com/1424-8220/20/4/1135)
