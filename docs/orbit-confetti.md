# Orbit Confetti

Orbit Confetti is a tiled particle field where each cell owns a small orbiting accent. The charm comes from per-cell variation inside a readable lattice, not from brute-force particle count.

## Visual Behavior

The default output should show a clear cell rhythm with small local orbits, modest color variation, and optional short trails. Higher `cellDensity` should increase the number of local systems. Higher `orbitRadius` should make motion more legible. Higher `jitter` should loosen the grid without losing the idea of per-cell independence.

## High-Level Components

- square or hex-like cell decomposition
- per-cell hash for phase and styling
- local orbit parametrics
- simple SDF particles
- optional trail or persistence treatment

## Plausible Implementation

Divide the frame into cells with `floor()` and `fract()`. Use cell ID hashing to assign orbit radius, phase, color, and sometimes particle shape. Render one or a few particles per cell at `center + radius * vec2(cos(t), sin(t))`, then add a simple radial falloff or short trail. The effect stays light when it remains procedural and cell-local.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: may be partially transparent outside particles

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| cellDensity | number | 0.4 | `0..1` | Number of local orbit systems across the frame |
| orbitRadius | number | 0.3 | `0..1` | Distance of particles from each cell center |
| particleSize | number | 0.18 | `0..1` | Size of each orbiting accent |
| speed | number | 0.35 | `0..1` | Orbit rate |
| trails | number | 0.12 | `0..1` | Motion trail intensity |
| jitter | number | 0.1 | `0..1` | Breaks perfect lattice regularity |
| palette | color[] | three bright accents | 2 to 5 colors | Per-cell color choices |

## Sizing Behavior

The effect is frame-relative. Resizing should preserve the sense of a field of small local systems rather than scaling each cell into a giant isolated orbit.

## Motion Behavior

- Motion is animation-first, but the effect should still look intentional when frozen.
- `animate=false` should stop orbiting while preserving the cell layout.
- Fixed `seed`, params, frame size, and `time` should produce deterministic output.

## Performance And Fallbacks

This is practical as a single-pass procedural effect as long as each cell contains only a few particles.

- No-WebGL fallback: Canvas 2D or SVG circles with per-cell transforms
- Slow-WebGL fallback: reduce `cellDensity`, limit to one particle per cell, and disable trails

## Differentiation Guidance

Differentiate with lattice choice, particle shape, motion law, and color logic. The effect should not turn into an undifferentiated starfield or a full particle sim.

## Conformance Cases

- `default-lattice`: default params in a 1200x800 frame
- `dense-cells`: high `cellDensity` with low `trails`
- `frozen-grid`: animation disabled with fixed `seed`

## Public References

- [InspírNathan — hexagon/grid shader tutorial](https://inspirnathan.com/posts/174-interactive-hexagon-grid-tutorial-part-5/)
- [The Book of Shaders — patterns](https://thebookofshaders.com/09/)
- [The Book of Shaders — random](https://thebookofshaders.com/10/)
- [Shadertoy — grid and dot particle example](https://www.shadertoy.com/view/wXccRf)
