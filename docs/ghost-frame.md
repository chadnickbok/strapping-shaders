# Ghost Frame

Ghost Frame is a rounded frame overlay for cards, dialog surfaces, and atmospheric UI. The look is a light spectral border where vapor feels emitted from the center, catches on the frame shell, and can briefly overdrive into a soft poof burst.

This spec maps directly to the current `ghost-frame` runtime effect.

## Visual Behavior

The default output should feel haunted and airy, not muddy. The center should stay readable while smoke becomes most visible near the border band and just outside it. Increasing `burstAmount` should intensify smoke, expansion, glow, and turbulence for a short envelope without turning the frame into a solid fog block.

## High-Level Components

- rounded-rectangle SDF for the shared frame shell
- center-origin vapor source field
- outward advection via radial bias plus layered fBM
- edge catch masks on the border band, inner shell, and outer shell
- host-driven burst envelope

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: transparent interior is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| thicknessPx | number | 16 | `0..64` | Visible border thickness in CSS pixels |
| cornerRadiusPx | number | 28 | `0..120` | Rounded-frame radius in CSS pixels |
| insetPx | number | 14 | `-32..32` | Moves the frame inward or outward relative to the canvas edge |
| tint | color | `#d6f6ff` | any valid hex color | Primary frame color |
| glowStrength | number | 0.34 | `0..1` | Halo intensity |
| glowSpread | number | 0.44 | `0..1` | Halo reach outside the frame |
| edgeSoftness | number | 0.48 | `0..1` | Broadens the condensation around the frame shell |
| smokeAmount | number | 0.52 | `0..1` | Overall vapor density |
| smokeScale | number | 0.42 | `0..1` | Size of smoke folds and clumps |
| smokeDrift | number | 0.32 | `0..1` | Motion speed and outward drift strength |
| centerSource | number | 0.56 | `0..1` | How strongly the effect feels emitted from the center |
| edgeCatch | number | 0.68 | `0..1` | How much the border shell brightens and condenses the vapor |
| burstAmount | number | 0 | `0..1` | Current host-driven poof envelope strength |
| burstExpansion | number | 0.58 | `0..1` | Extra outward push during a burst |
| burstGlowBoost | number | 0.66 | `0..1` | Extra halo intensity during a burst |
| burstTurbulence | number | 0.5 | `0..1` | Extra swirl and breakup during a burst |

## Sizing Behavior

The effect is frame-relative. `thicknessPx`, `cornerRadiusPx`, and `insetPx` stay pixel-based as the frame resizes. Resizing should preserve perceived border weight instead of scaling the effect proportionally with the box.

## Motion And Interaction

- Motion is optional.
- `animate=false` should freeze the idle smoke drift cleanly.
- `burstAmount` is the v1 interaction contract. Hosts should animate it externally for click or hover bursts instead of relying on hidden shader state.
- Fixed `time`, `seed`, frame size, and params should render deterministically.

## Performance And Fallbacks

The effect is single-pass and procedural. The cost comes from layered noise and soft shells, not from any simulation buffer.

- No-WebGL fallback: rounded HTML card with layered box-shadows and a restrained radial haze
- Slow-WebGL fallback: simplify smoke frequencies before changing thickness semantics

## Conformance Cases

- `default-card`: default params in a 420x280 frame
- `burst-envelope`: `burstAmount=1` with default burst tuning
- `static-overlay`: transparent-center frame with animation disabled

## Public References

- [The Book of Shaders — Shapes](https://thebookofshaders.com/07/)
- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [The Book of Shaders — Fractal Brownian Motion](https://thebookofshaders.com/13/)
- [pkh — Perfecting anti-aliasing on signed distance functions](https://blog.pkh.me/p/44-perfecting-anti-aliasing-on-signed-distance-functions.html)
- [Raph Levien — Blurred rounded rectangles](https://raphlinus.github.io/graphics/2020/04/21/blurred-rounded-rects.html)
