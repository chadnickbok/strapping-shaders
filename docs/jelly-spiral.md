# Jelly Spiral

Jelly Spiral is a soft-edged spiral ribbon with elastic thickness changes and a slightly gooey motion profile. The key identity is the soft spiral field, not just rotation.

## Visual Behavior

The default image should show a readable spiral with rounded edges, mild pulse, and subtle wobble. Higher `turns` increases the number of wraps. Higher `wobble` makes the outline feel more gelatinous. Higher `softness` should blur the edge rather than erase the shape.

## High-Level Components

- polar coordinate transform
- spiral implicit function or SDF
- thickness modulation
- low-frequency wobble
- soft glow or rim emphasis

## Plausible Implementation

Transform UVs into polar space with `atan()` and `length()`, define a spiral field such as `abs(r - k * angle - phase)`, and threshold it with `smoothstep`. Add thickness modulation and a low-frequency displacement or pulse so the ribbon feels elastic. Derivative-based antialiasing is a better fit than brute-force supersampling.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: may be transparent outside the spiral

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| turns | number | 2.8 | `1..6` | Number of spiral wraps |
| thickness | number | 0.22 | `0.05..0.5` | Ribbon width |
| wobble | number | 0.2 | `0..1` | Soft displacement strength |
| softness | number | 0.35 | `0..1` | Edge feathering |
| pulse | number | 0.18 | `0..1` | Breathing or width oscillation |
| tint | color | `#ff72c2` | any valid color | Primary spiral color |
| glow | number | 0.2 | `0..1` | Outer halo intensity |

## Sizing Behavior

The effect is frame-relative. Resizing should keep the spiral centered and readable instead of flattening it into an oval or changing the perceived number of turns.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze wobble and pulse.
- With fixed `seed`, frame size, params, and `time`, output should be deterministic.

## Performance And Fallbacks

This should remain a clean single-pass effect unless a heavy bloom pass is added.

- No-WebGL fallback: SVG spiral path with animated stroke width and blur
- Slow-WebGL fallback: keep the spiral field and disable secondary wobble

## Differentiation Guidance

Differentiate with asymmetry, tapering, arm count, and timing. The family is public and common; the specific feel comes from softness and pulse design.

## Conformance Cases

- `default-spiral`: default params in a square frame
- `gooey-wide`: thick ribbon with high `wobble`
- `paused-ribbon`: animation disabled with fixed `time`

## Public References

- [The Book of Shaders — shapes](https://thebookofshaders.com/07/)
- [The Book of Shaders — transforms and polar ideas](https://thebookofshaders.com/08/)
- [Shadertoy — Spiral SDF Testing 2](https://www.shadertoy.com/view/3tGSWd)
- [Evan Wallace — antialiasing with screen-space derivatives](https://madebyevan.com/shaders/grid/)
