# Studio Dither Fade

Studio Dither Fade is an editorial post-process treatment for photography and graphic surfaces. It should feel like a controlled reveal on paper stock: quantized tone, ordered thresholds, and a little print texture, without collapsing into novelty retro graphics.

This spec corresponds to the current `studio-dither-fade` runtime family.

## Visual Behavior

The default output should partially resolve the source image through a dither pattern while leaving a visible paper body underneath. Increasing `fade` should move the image toward fuller coverage. Increasing `quantize` should reduce tonal resolution before dithering. Increasing `patternMix` should shift the effect from visible Bayer structure toward noisier thresholding.

## High-Level Components

- source-image sampling
- tonal contrast shaping
- ordered or noise-mixed thresholding
- palette quantization
- paper tint and grain

## Plausible Implementation

Sample a source image on a coarser dither grid, quantize its tone, then compare those values against an ordered threshold matrix blended with a noisier mask. Use the resulting coverage to reveal the quantized image over a tinted paper base. The runtime can stay intentionally stylized as long as the fade, quantization, and paper semantics remain clear.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| fade | number | `0.74` | `0..1` | Overall reveal amount |
| pixelSize | number | `0.34` | `0..1` | Size of the internal dither cells |
| patternMix | number | `0.66` | `0..1` | Blend between Bayer thresholds and noise |
| quantize | number | `0.42` | `0..1` | Tonal reduction strength |
| contrast | number | `0.5` | `0..1` | Tonal push before quantization |
| paperGrain | number | `0.24` | `0..1` | Strength of the paper texture |
| paperTint | color | `#f3efe3` | any valid color | Paper stock tint |
| shadowTint | color | `#151515` | any valid color | Shadow / ink tint |

## Sizing Behavior

The effect depends on the bound image, but the dither grid is screen-relative. Resizing should preserve the intentional relationship between the cell size and the image rather than stretching the dither pattern independently from the source.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the treatment cleanly.
- With a fixed `seed`, frame size, image, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

This family is moderate in cost because it is a single-pass image treatment with a small amount of extra math but no heavy blur.

- No-WebGL fallback: prerendered halftone or CSS mix-blend approximation
- Slow-WebGL fallback: reduce grid complexity before changing the reveal semantics

## Differentiation Guidance

Differentiate through reveal pacing, threshold structure, palette reduction, and paper finish. This family should feel like a polished studio print treatment, not the more scene-driven procedural study used by the separate `dithering` effect in this repo.

## Conformance Cases

- `default-proof`: default params on the sample image
- `paper-poster`: larger cells and stronger paper grain
- `full-resolve`: high `fade` with moderate `quantize`

## Public References

- [HandWiki - Ordered dithering](https://handwiki.org/wiki/Ordered_dithering)
- [CiNii - Bayer, An optimum method for two-level rendition of continuous-tone pictures](https://cir.nii.ac.jp/crid/1570854176364694656?lang=en)
- [Maxime Heckel - The Art of Dithering and Retro Shading for the Web](https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/)
- [Codrops - Building a Real-Time Dithering Shader](https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/)
- [Three.js - Material.alphaHash](https://threejs.org/docs/pages/Material.html)
