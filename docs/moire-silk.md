# Moire Silk

Moire Silk is a controlled interference pattern built from overlapping line systems. It should feel like optical fabric, fine print error, or lustrous silk rather than like a harsh aliasing bug.

This spec corresponds to the current `moire-silk` runtime family.

## Visual Behavior

The default output should produce broad interference bands over a darker woven body. Increasing `lineDensity` should tighten the line systems while still preserving visible large-scale bands. Increasing `sheen` should add directional highlights without erasing the moire structure. `jitter` should trade perfect interference for a more organic textile read.

## High-Level Components

- layered line fields or stripe grids
- rotation and scale offsets
- optional jitter / anti-aliasing breakup
- directional sheen
- palette-mapped banding

## Plausible Implementation

Create two or more stripe fields with slightly different angles and frequencies, then compare or combine them to form large-scale interference bands. Apply a small noise-driven warp to keep the effect from feeling mechanically perfect, and add a directional sheen term so the surface leans toward silk or satin instead of raw optical-art lines.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| palette | palette | `["#11131d", "#384667", "#a79fcc", "#f0dfcb"]` | `3..6` colors | Ordered ramp for body and highlights |
| lineDensity | number | `0.46` | `0..1` | Frequency of the stripe systems |
| rotationDeg | number | `22` | `0..180` | Primary stripe direction |
| interference | number | `0.66` | `0..1` | Relative angle / scale offset between fields |
| jitter | number | `0.18` | `0..1` | Organic breakup of the line systems |
| sheen | number | `0.48` | `0..1` | Directional silk highlight |
| drift | number | `0.24` | `0..1` | Motion speed of the banding |
| opacity | number | `1` | `0..1` | Overall opacity |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the relationship between the fine line structure and the large interference bands, rather than turning the entire frame into either a flat color wash or a pure high-frequency grid.

## Motion Behavior

- Motion is optional.
- `animate=false` should freeze the line fields and sheen sweep cleanly.
- With a fixed `seed`, frame size, and explicit `time`, output should be deterministic.

## Performance And Fallbacks

This family is cheap in a single pass. The main risk is aliasing from overly dense line systems.

- No-WebGL fallback: static moire print or striped SVG overlay
- Slow-WebGL fallback: reduce line frequency before changing interference semantics

## Differentiation Guidance

Differentiate through stripe frequency, palette restraint, jitter, and sheen direction. The effect should stay in the zone between optical interference and elegant fabric, not collapse into checkerboards or CRT scanline artifacts.

## Conformance Cases

- `default-silk`: default params on a 1440x900 frame
- `editorial-satin`: tighter line field with more sheen
- `still-fabric`: animation disabled with a fixed `seed`

## Public References

- [Saveljev, Kim, Kim - Moire effect in displays: a tutorial](https://pubs.kist.re.kr/handle/201004/121669)
- [Saveljev and Kim - Simulation and measurement of moire patterns at finite distance](https://opg.optica.org/abstract.cfm?uri=oe-20-3-2163)
- [Filthy Pants - Trading Moire for Noise in Shaders](https://filthypants.blogspot.com/2018/06/trading-moire-for-noise-in-shaders.html)
- [The DO Loop - Moire patterns](https://blogs.sas.com/content/iml/2023/06/05/moire-patterns.html)
