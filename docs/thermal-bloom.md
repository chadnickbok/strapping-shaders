# Thermal Bloom

Thermal Bloom is a false-color heatmap treatment with optional isotherm contours and hotspot glow. It should feel like a thermal imaging palette or sci-fi instrument display depending on the chosen defaults.

## Visual Behavior

The default output should map the source image through a thermal palette with bright regions clearly separated from cool ones. Higher `hotThreshold` should reserve bloom for a smaller hot range. Higher `contours` should make banding or isotherms more visible. The palette should remain readable even before bloom is added.

## High-Level Components

- scalar extraction from the source
- thermal color ramp or LUT
- threshold bands or contours
- optional hotspot bloom

## Plausible Implementation

Compute a scalar field from luminance, alpha, or a mask derived from the source image, map it through a thermal palette, optionally add contour bands, then bloom only the highest range. This is a straightforward palette-mapping problem with optional post treatment.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: preserve source alpha when relevant

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palettePreset | string | `ironbow` | `ironbow`, `whiteHot`, `lava`, `medical` | Named thermal palette |
| hotThreshold | number | 0.72 | `0..1` | Range where bloom begins |
| contrast | number | 0.45 | `0..1` | Input scalar shaping before palette lookup |
| contours | number | 0.18 | `0..1` | Strength of isotherm banding |
| bloom | number | 0.2 | `0..1` | Glow strength on hot areas |
| noise | number | 0.05 | `0..1` | Instrument-like noise or grain |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is content-aware and image-space. Resizing should preserve the palette read and contour cadence rather than turning the treatment into flat posterization.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze any noise or palette drift.
- Fixed source, params, frame size, `seed`, and `time` should produce deterministic output.

## Performance And Fallbacks

Palette mapping is trivial. Bloom is the only substantive extra cost.

- No-WebGL fallback: Canvas or SVG gradient mapping, or static export
- Slow-WebGL fallback: disable bloom and keep the palette map plus optional contours

## Differentiation Guidance

Differentiate through palette choice, thresholding, and whether the output feels like instrumentation, scientific imaging, or stylized sci-fi UI.

## Conformance Cases

- `default-thermal`: default params on a grayscale-rich source image
- `instrument-readout`: low `bloom` with visible `contours`
- `static-heatmap`: animation disabled with fixed source

## Public References

- [FLIR — Picking a Thermal Color Palette](https://www.flir.com/discover/industrial/picking-a-thermal-color-palette/)
- [GST — Thermal imaging color palettes](https://gst.com/pages/thermal-imaging-color-palettes)
- [Unity Manual — Bloom](https://docs.unity3d.com/Manual/PostProcessing-Bloom.html)
- [Shadertoy — Fake Thermal](https://www.shadertoy.com/view/lXBczw)
