# Cinematic Bokeh

Cinematic Bokeh is a photographic blur treatment for hero images, posters, and scene transitions. It should read like a stylized depth-of-field pass with bright highlights blooming into the blur kernel rather than like a generic Gaussian blur.

This spec corresponds to the current `cinematic-bokeh` runtime family.

## Visual Behavior

The default output should preserve a recognizable in-focus band while bright points and high-luminance regions bloom into polygonal blur shapes outside that band. Increasing `aperture` should broaden the blur radius. Increasing `anamorphic` should stretch the bokeh horizontally without turning the effect into a streak flare.

## High-Level Components

- source-image sampling
- artist-controlled focus band
- highlight-weighted blur kernel
- polygonal aperture shaping
- restrained post-bloom

## Plausible Implementation

Use a screen-space blur kernel whose radius is driven by an artist-controlled focus band rather than a true scene depth buffer. Weight bright samples more heavily so highlights expand into visible bokeh discs, optionally shaped by an n-gon aperture model. A fully physical camera model is not required for this catalog if the focus, aperture, and highlight semantics remain stable.

## Inputs

- Input type: required image
- Asset bindings: `sourceImage`
- Alpha: preserve source alpha when present

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| focus | number | `0.5` | `0..1` | Vertical position of the in-focus band |
| focusSpread | number | `0.22` | `0.02..1` | Width of the in-focus region |
| aperture | number | `0.36` | `0..1` | Blur radius / depth-of-field strength |
| highlightBoost | number | `0.56` | `0..1` | Extra weight given to bright samples |
| anamorphic | number | `0.18` | `0..1` | Horizontal stretch of the kernel |
| bladeCount | number | `6` | `3..8` | Polygonal aperture blade count |
| bloom | number | `0.26` | `0..1` | Additional glow after the blur pass |

## Sizing Behavior

The blur radius is image-relative. Resizing should preserve the photographic read of the kernel and the position of the focus band rather than scaling the effect into an obvious low-resolution smear.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the effect cleanly.
- With a fixed `seed`, frame size, image, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

The main cost is the multi-tap blur kernel. Highlight weighting and bloom are secondary costs.

- No-WebGL fallback: CSS blur plus a lightweight highlight overlay
- Slow-WebGL fallback: reduce taps before changing focus semantics

## Differentiation Guidance

Differentiate through focus placement, blur radius, aperture shape, and highlight restraint. This family should stay photographic and tastefully cinematic rather than collapsing into lens-flare spectacle.

## Conformance Cases

- `default-focus`: default params on a medium photo
- `night-portrait`: stronger `highlightBoost` and narrower `focusSpread`
- `wide-screen`: higher `anamorphic` with moderate `aperture`

## Public References

- [GPU Gems - Depth of Field: A Survey of Techniques](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-23-depth-field-survey-techniques)
- [GPU Gems 3 - Practical Post-Process Depth of Field](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-28-practical-post-process-depth-field)
- [Martins Upitis - GLSL depth of field with bokeh v2.4](https://devlog-martinsh.blogspot.com/2011/12/glsl-depth-of-field-with-bokeh-v24.html)
- [Three.js - BokehPass](https://threejs.org/docs/pages/BokehPass.html)
- [Three.js - BokehShader](https://threejs.org/docs/pages/module-BokehShader.html)
