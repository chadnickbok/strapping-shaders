# Button Emitter Aura

Button Emitter Aura is a button-local aura shader for interactive UI. The effect renders inside a larger transparent host, but its masks are driven by the measured rounded-rectangle of the button itself. The shipped looks are a pale omnidirectional Ghost Button and a warm upward-biased Fire Button, both built on the same emitter shell.

This spec maps directly to the current `button-emitter-aura` runtime effect.

## Visual Behavior

The default output should feel like wisps emitted from the button edge rather than fog filling the whole host. The aura should stay outside the button, peak near the contour, and fade cleanly within a short pixel shell. Ghost Button should stay soft and airy, with plume structure that can travel along the contour before peeling away. Fire Button should feel brighter, tighter, and more upward-driven without becoming a literal simulation.

## High-Level Components

- rounded-rectangle SDF driven by measured button geometry
- outside-only emission shell around the button edge
- source weighting that injects density closest to the contour
- layered fBM with contour-following transport and local warp
- directional bias for isotropic ghost vapor or upward fire tongues
- host-driven burst envelope for click feedback

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: transparent host output is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| buttonCenterXPx | number | 280 | `0..4096` | Host-provided button center X in host-local pixels |
| buttonCenterYPx | number | 160 | `0..4096` | Host-provided button center Y in host-local pixels |
| buttonWidthPx | number | 220 | `1..2048` | Host-provided button width in pixels |
| buttonHeightPx | number | 72 | `1..2048` | Host-provided button height in pixels |
| buttonRadiusPx | number | 22 | `0..512` | Host-provided rounded-corner radius in pixels |
| emitRadiusPx | number | 30 | `0..128` | Maximum shell reach away from the button edge |
| edgeSoftnessPx | number | 9 | `0..24` | Softness of the shell transitions |
| noiseScale | number | 0.06 | `0.02..0.16` | Size of large plume structure |
| noiseAmount | number | 0.72 | `0..1` | Strength of warp and breakup |
| driftSpeed | number | 0.1 | `0..1` | Advection speed along the resolved flow |
| directionX | number | 0 | `-1..1` | Preferred horizontal flow direction |
| directionY | number | 0 | `-1..1` | Preferred vertical flow direction; negative rises upward in host coordinates |
| directionalBias | number | 0.1 | `0..1` | Bends radial outflow toward the preferred direction as plumes travel away from the source |
| glowStrength | number | 0.44 | `0..1` | Halo intensity around denser regions |
| tintA | color | `#f6fbff` | any valid hex color | Base body color |
| tintB | color | `#cde7ff` | any valid hex color | Highlight color |
| burstAmount | number | 0 | `0..1` | Current host-driven burst envelope |
| burstPhase | number | 0 | `0..1` | Normalized host-driven burst progress, used to distinguish attack from decay |
| sourceBias | number | 13 | `1..48` | How tightly density hugs the edge before dissipating |
| outflowStrength | number | 0.9 | `0..1` | How strongly the motion reads as button-local outward emission |
| curlStrength | number | 0.44 | `0..1` | Tangential roll layered on top of the outward flow |
| detailMix | number | 0.42 | `0..1` | Balance between broad plumes and finer breakup |
| hotspotPower | number | 1.25 | `0.5..4` | Sharpens highlight response for fire-like looks |

## Host Integration

The host should position the WebGL canvas and the actual button inside the same relatively positioned box, then measure the button rectangle relative to that host.

```html
<div class="button-emitter-host">
  <canvas class="button-emitter-canvas"></canvas>
  <button class="button-emitter-button">Ghost Button</button>
</div>
```

At minimum the host should pass:

- `buttonCenterXPx`
- `buttonCenterYPx`
- `buttonWidthPx`
- `buttonHeightPx`
- `buttonRadiusPx`

Those values are the geometry contract for the shader. The host owns measurement and interaction; the shader stays stateless apart from `time`, `seed`, and the exposed params.

## Preset Guidance

- Ghost Button:
  - `directionX=0`, `directionY=0`, `directionalBias` low
  - high `outflowStrength`, medium `curlStrength`
  - pale tints, softer shell, lower glow, broader density
- Fire Button:
  - `directionX=0`, `directionY=-1`, `directionalBias` high
  - medium-high `outflowStrength`, lower `curlStrength`
  - warmer tints, larger shell, stronger glow, tighter hotspots

The playground demo intentionally uses a neutral black stage so any warmth comes from the shader and button accents, not from the background artwork.

The shipped runtime uses Ghost Button defaults and exposes Fire Button as an authored preset.

## Sizing Behavior

The aura is button-relative, not host-relative. Resizing the host should not stretch the effect across the whole canvas; it should keep hugging the measured button geometry with pixel-based falloff.

## Motion And Interaction

- Motion is optional.
- `animate=false` should freeze the field cleanly.
- Idle motion is button-local. Ghost defaults should read as wisps that can travel smoothly around the contour and then peel outward, not as one coherent translated field.
- Direction is a bias on top of that contour-following base. Fire should still originate from the full button contour, then bend upward as the shell travels away from the source.
- `burstAmount` and `burstPhase` are the v1 interaction contract. Hosts should animate them externally for click bursts instead of relying on hidden shader state.
- The intended host pattern is an early peak in `burstAmount` while `burstPhase` continues from `0` to `1`, so the shader can treat the click as an actual poof with attack and decay.
- Fixed `seed`, `time`, host geometry, and params should render deterministically.

## Performance And Fallbacks

The effect is single-pass and procedural. The main cost is layered noise and shell shaping; there is no history buffer and no blur pass in v1.

- No-WebGL fallback: regular HTML button with restrained box-shadow and a soft pseudo-element halo
- Slow-WebGL fallback: reduce noise frequency or render scale before changing shell semantics

## Conformance Cases

- `ghost-default`: default params in a 560x320 host with a centered 220x72 button
- `fire-preset`: Fire Button preset with upward bias and warm tints
- `burst-envelope`: `burstAmount=1`, `burstPhase=0.2` over the same measured geometry
- `static-host`: animation disabled with deterministic output

## Public References

- [The Book of Shaders — Shapes](https://thebookofshaders.com/07/)
- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [The Book of Shaders — Fractal Brownian Motion](https://thebookofshaders.com/13/)
- [Mortoray — Quickly drawing a rounded rectangle with a GL shader](https://mortoray.com/quickly-drawing-a-rounded-rectangle-with-a-gl-shader/)
- [pkh — Perfecting anti-aliasing on signed distance functions](https://blog.pkh.me/p/44-perfecting-anti-aliasing-on-signed-distance-functions.html)
- [Raph Levien — Blurred rounded rectangles](https://raphlinus.github.io/graphics/2020/04/21/blurred-rounded-rects.html)
- [GPU Gems — Implementing Improved Perlin Noise](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-5-implementing-improved-perlin-noise)
- [GPU Gems — Fire in the "Vulcan" Demo](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-6-fire-vulcan-demo)
- [Febucci — Procedural fire shader tutorial](https://blog.febucci.com/2019/05/fire-shader/)
