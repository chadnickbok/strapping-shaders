# Star Tunnel

Star Tunnel is a radial starfield with depth-weighted streaking toward a vanishing point. The effect should feel like coherent warp-speed motion, not just dots moving outward.

## Visual Behavior

The default output should show layered stars with clear radial acceleration and depth variation. Higher `density` increases the number of visible stars. Higher `streakLength` should stretch stars along their path without losing the vanishing-point structure. Higher `depth` should make the tunnel feel more layered.

## High-Level Components

- particle hashing
- depth layers
- polar or radial velocity field
- streaking based on speed and depth
- exposure falloff

## Plausible Implementation

Use hashed stars distributed across layered radial space, give each star a depth-derived speed, and stretch it along its motion vector as it moves away from the vanishing point. This is a procedural starfield problem rather than a full 3D scene requirement.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: usually opaque over a dark field

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| density | number | 0.38 | `0..1` | Number of visible stars |
| streakLength | number | 0.28 | `0..1` | Motion stretch per star |
| speed | number | 0.45 | `0..1` | Forward travel rate |
| depth | number | 0.5 | `0..1` | Number and spacing of depth layers |
| twinkle | number | 0.08 | `0..1` | Small brightness variation |
| tint | color | `#d9ecff` | any valid color | Primary star color |
| backgroundColor | color | `#02040a` | any valid color | Base field color |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the center of motion and the density law, not reinterpret the field as a few giant streaks.

## Motion Behavior

- Motion is animation-first.
- `animate=false` should freeze the current tunnel state without changing depth layering.
- With fixed `seed`, params, frame size, and `time`, output should be deterministic.

## Performance And Fallbacks

This remains practical as a single-pass procedural background.

- No-WebGL fallback: Canvas 2D starfield or looping pre-rendered video
- Slow-WebGL fallback: reduce `density` and `streakLength`

## Differentiation Guidance

Differentiate with vanishing-point placement, density law, noise level, and whether the tunnel feels clean and sci-fi or retro and noisy.

## Conformance Cases

- `default-warp`: default params in a wide frame
- `long-streaks`: high `streakLength` with high `speed`
- `paused-flight`: animation disabled with fixed `seed`

## Public References

- [Rob Harper — GLSL Starfield](https://www.robharper.ca/glsl-starfield/)
- [The Book of Shaders — random](https://thebookofshaders.com/10/)
- [Shadertoy — Starry Infinite Tunnel v3](https://www.shadertoy.com/view/M3cGDX)
- [Shadertoy — A Tunnel](https://www.shadertoy.com/view/Ms2SD1)
