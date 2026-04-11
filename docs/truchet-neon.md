# Truchet Neon

Truchet Neon is a glowing tile maze built from quarter-circle arcs. The lineage is intentionally legible: classic Truchet tiling plus modern glow treatment.

## Visual Behavior

The default image should show looping arc paths with a bright core and a wider halo. Higher `tileSize` should produce larger maze features. Higher `mazeBias` should make runs feel more continuous. Higher `glow` should expand the halo without erasing the underlying arc geometry.

## High-Level Components

- square tiling
- Truchet tile flips or rotations
- arc SDF for tube geometry
- emissive core plus glow
- optional bloom

## Plausible Implementation

Use a classic square Truchet tile with two quarter-circle arcs, rotate or flip it from a hashed cell ID, then compute distance to the arc centerline. Render a bright tube core and a wider falloff for the halo. Optional bloom can strengthen the look, but the base effect should already read clearly in a single pass.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| tileSize | number | 0.4 | `0..1` | Size of the Truchet grid |
| tubeWidth | number | 0.18 | `0.05..0.4` | Width of each arc tube |
| glow | number | 0.45 | `0..1` | Halo intensity |
| mazeBias | number | 0.5 | `0..1` | Favors longer visual runs over noisier tile changes |
| speed | number | 0.12 | `0..1` | Optional shimmer or tile animation rate |
| tint | color | `#5ff3ff` | any valid color | Primary neon color |
| backgroundColor | color | `#071018` | any valid color | Field behind the tile system |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the apparent grid density and the legibility of each arc path.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze shimmer or subtle tile evolution.
- Fixed params, frame size, `seed`, and `time` should yield deterministic output.

## Performance And Fallbacks

The base tile math is cheap. Bloom is the main optional cost.

- No-WebGL fallback: SVG arcs with blur or duplicated stroke glows
- Slow-WebGL fallback: keep the single-pass glow and disable bloom

## Differentiation Guidance

Differentiate with tile variations, glow falloff, maze bias, and color defaults. The distinctive part should come from composition and styling, not from pretending the Truchet lineage is novel.

## Conformance Cases

- `default-maze`: default params in a 1200x800 frame
- `large-tubes`: high `tubeWidth` with moderate `glow`
- `still-neon`: animation disabled with fixed `seed`

## Public References

- [MathWorld — Truchet Tiling](https://mathworld.wolfram.com/TruchetTiling.html)
- [The Book of Shaders — patterns](https://thebookofshaders.com/09/)
- [The Book of Shaders — distance fields and shapes](https://thebookofshaders.com/07/)
- [Three.js — UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html)
- [Shadertoy — Multiscale Neon Truchet](https://www.shadertoy.com/view/DtycDc)
