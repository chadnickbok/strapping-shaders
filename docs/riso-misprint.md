# Riso Misprint

Riso Misprint is a print simulation built from limited inks, visible screens, and slight misregistration. The goal is constrained spot-color charm and imperfection, not generic poster noise.

## Visual Behavior

The default output should show a small ink palette, visible dot or screen structure, slight layer offsets, and paper showing through. Higher `misregisterPx` should push the plates apart without destroying readability. Higher `bleed` should soften the dots and edges.

## High-Level Components

- source-image channel separation
- halftone or dither screens
- spot-color tinting
- layer offset and rotation
- paper tone and overprint compositing

## Plausible Implementation

Split the source into a small number of grayscale channels, convert each into a halftone or screen, tint each layer with a spot color, then offset and rotate them slightly to simulate misregistration. Add paper tone and a little spread or bleed. This is squarely in the public design-and-shader literature around risograph simulation.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: output is typically fully opaque over paper tone

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| inks | color[] | cyan, fluorescent pink, yellow | 2 to 4 colors | Spot-color palette |
| dotScale | number | 0.35 | `0..1` | Halftone or screen frequency |
| misregisterPx | number | 2 | `0..12` | Plate offset amount in pixels |
| bleed | number | 0.12 | `0..1` | Ink spread and softness |
| paperTone | color | `#f5eddc` | any valid color | Paper substrate color |
| contrast | number | 0.5 | `0..1` | Separation between light and dark regions |
| angleJitterDeg | number | 4 | `0..15` | Variation in screen angle relationships |

## Sizing Behavior

The effect is content-aware, but screen scale should remain stable enough that a resized poster still feels like the same print process rather than a different rasterization.

## Motion Behavior

- Motion is normally disabled.
- `animate=false` should be the natural default.
- If later versions add subtle plate drift, fixed `seed` and `time` should remain deterministic.

## Performance And Fallbacks

Cost scales with the number of inks and the complexity of the screen evaluation.

- No-WebGL fallback: Canvas or SVG print simulation, or offline raster export
- Slow-WebGL fallback: reduce ink count and coarsen the halftone

## Differentiation Guidance

Differentiate with ink palette, angle logic, registration model, and paper choice. Decide whether the result feels archival, loud and fluorescent, or rough and handmade.

## Conformance Cases

- `default-riso`: default params on a poster image
- `misregistered-proof`: high `misregisterPx` with restrained `bleed`
- `static-print`: no motion, fixed paper tone, fixed source

## Public References

- [FIT — Riso File Prep Guide](https://www.fitnyc.edu/documents/printfx/pfx-guide-riso.pdf)
- [Codrops — Risograph Printing with WebGL](https://tympanus.net/codrops/2024/06/27/digital-meets-physical-risograph-printing-with-webgl/)
- [Stefan Gustavson — GLSL halftone tutorial](https://web.archive.org/web/20221129015655/http://www.itn.liu.se/~stegu76/webglshadertutorial/shadertutorial.html)
- [Nicole Lin — Risograph Shader](https://nicolelin.ca/riso)
