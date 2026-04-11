# Paper Fibers

Paper Fibers is a procedural material surface for paper stock, poster board, or vellum-like backgrounds. The goal is tactile substrate, not generic film grain.

## Visual Behavior

The default output should show subtle tooth, faint directional fibers, and low-contrast blotching. Increasing `fiberStrength` should reveal more linear structure. Increasing `emboss` should make the paper catch light without becoming metallic. Higher `grain` should add texture but stay subordinate to the paper stock identity.

## High-Level Components

- anisotropic streak noise for fibers
- blotch or density variation
- small crease or pressure masks
- bump-derived lighting response
- paper tone base

## Plausible Implementation

Combine several restrained procedural layers: elongated directional streaks for fibers, broader blotch noise for density variation, sparse crease masks, and a tiny bump-to-normal response for lighting. This is a classic procedural texture problem and can also be baked to a tile when runtime simplicity matters more than live variation.

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: fully opaque by default

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| paperTone | color | `#f2eadf` | any valid color | Base stock color |
| fiberStrength | number | 0.22 | `0..1` | Visibility of directional fibers |
| blotches | number | 0.12 | `0..1` | Broad density variation |
| emboss | number | 0.1 | `0..1` | Light catching from micro-relief |
| grain | number | 0.14 | `0..1` | Fine surface texture |
| fiberAngleDeg | number | 12 | `0..180` | Dominant fiber direction |
| opacity | number | 1 | `0..1` | Overall opacity |

## Sizing Behavior

The effect is frame-relative, but the texture scale should remain tied to a believable material grain. Resizing should not make the paper suddenly feel like cloth or stone.

## Motion Behavior

- Motion is normally disabled or extremely subtle.
- `animate=false` should be a natural default.
- If a later implementation adds motion, fixed `seed` and `time` should stay deterministic.

## Performance And Fallbacks

The best low-end strategy is often to bake once and sample the result.

- No-WebGL fallback: tiled paper image or SVG turbulence overlay
- Slow-WebGL fallback: pre-bake the texture, then sample a single tile

## Differentiation Guidance

Differentiate by choosing a stock identity: cotton rag, recycled board, laid paper, vellum, or poster stock. The shader should feel like a material family, not just noise with a beige tint.

## Conformance Cases

- `default-stock`: default params in a poster-sized frame
- `embossed-board`: high `fiberStrength` with moderate `emboss`
- `still-paper`: static render with fixed `seed`

## Public References

- [MDPI Sensors — survey of procedural textures](https://www.mdpi.com/1424-8220/20/4/1135)
- [Steven Worley — A Cellular Texture Basis Function](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf)
- [Game Dev Bill — paper shader in Unity](https://gamedevbill.com/paper-shader-in-unity/)
- [The Book of Shaders — texture basics](https://thebookofshaders.com/11/)
