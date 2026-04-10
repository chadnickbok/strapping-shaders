# Pulse Trace Border

Pulse Trace Border is a bright rounded frame overlay for buttons, CTAs, and HUD-like UI. The look is a clean luminous border where packets travel around the perimeter, stretch into trails, and flare as they pass through corners.

This spec maps directly to the current `pulse-trace-border` runtime effect.

## Visual Behavior

The default output should feel crisp, energetic, and legible at smaller sizes. The center should stay clear while moving packets travel around the frame perimeter. Increasing `cornerBloom` should accent corner turns without making the entire border look blurry or over-bloomed.

## High-Level Components

- shared rounded-rectangle SDF frame shell
- perimeter-coordinate mapping for border motion
- moving highlight packets with trailing falloff
- corner bloom amplification
- outer glow shell for the neon trail

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: transparent interior is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| thicknessPx | number | 14 | `0..64` | Visible border thickness in CSS pixels |
| cornerRadiusPx | number | 28 | `0..120` | Rounded-frame radius in CSS pixels |
| insetPx | number | 12 | `-32..32` | Moves the frame inward or outward relative to the canvas edge |
| tint | color | `#7ed8ff` | any valid hex color | Base border color |
| glowStrength | number | 0.46 | `0..1` | Base halo intensity |
| glowSpread | number | 0.38 | `0..1` | How far the packet glow reaches outside the frame |
| accentTint | color | `#f8fbff` | any valid hex color | Packet highlight color |
| packetCount | number | 3 | `1..5` | Number of moving packets |
| packetSize | number | 0.32 | `0..1` | Head size for each packet |
| packetSpeed | number | 0.62 | `0..1` | Perimeter travel speed |
| trailLength | number | 0.58 | `0..1` | Linger length behind each packet |
| cornerBloom | number | 0.52 | `0..1` | Extra intensity at corners |
| wobble | number | 0.28 | `0..1` | Mild jitter for a less rigid trace |

## Sizing Behavior

The effect is frame-relative. `thicknessPx`, `cornerRadiusPx`, and `insetPx` stay pixel-based as the frame resizes. The border should stay readable at button and pill sizes without turning into a soft blob.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze packet positions cleanly.
- Fixed `time`, `seed`, frame size, and params should render deterministically.

## Performance And Fallbacks

The effect is single-pass and procedural. The main cost is the trail accumulation and outer-shell softening.

- No-WebGL fallback: rounded CSS border with animated gradient stroke or SVG path dash animation
- Slow-WebGL fallback: reduce packet count and wobble before changing border thickness

## Conformance Cases

- `default-cta`: default params in a 360x120 frame
- `small-button`: narrow frame with `packetCount=2`
- `static-trace`: frozen packet positions with animation disabled

## Public References

- [The Book of Shaders — Shapes](https://thebookofshaders.com/07/)
- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [pkh — Perfecting anti-aliasing on signed distance functions](https://blog.pkh.me/p/44-perfecting-anti-aliasing-on-signed-distance-functions.html)
- [Raph Levien — Blurred rounded rectangles](https://raphlinus.github.io/graphics/2020/04/21/blurred-rounded-rects.html)
