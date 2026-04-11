# Ghost Whoosh Button

Ghost Whoosh Button is a two-layer button effect built from one shader rendered twice: once under the button for the stored-smoke burst and once over the button for the idle wisps. The geometry stays a measured rounded-rectangle SDF, the plume detail comes from layered fBM, and the near-button motion briefly attaches to the curved outline before detaching into a freer plume.

This spec maps to the low-level `ghost-whoosh-button` effect and the higher-level `GhostWhooshButton` React component that renders the underlay and overlay together.

## Visual Behavior

The idle state should feel like smoke born in the center of the button, not a ring glued to the edge. A little vapor may remain visible over the face, then drift outward and upward after it escapes the silhouette. On click, that idle field should get blown out completely, then return only after the whoosh finishes and a short recovery delay passes. The large click event must still come from a separate emitter hidden below the button. The burst should read like stored smoke being pushed out from under the button in a quick `whumph`, then lifting and dissipating while the button itself remains visible.

## High-Level Components

- measured rounded-rectangle SDF from the real button
- one fragment shader rendered twice with different params
- center ellipse idle source for overlay wisps
- under-button capsule source for the click burst
- boundary-aware attach-then-detach motion near the button contour
- host-driven burst envelope for the click timeline

## Inputs

- Input type: procedural only
- Asset bindings: none
- Alpha: transparent host output is expected

## Parameters

| Name | Type | Default | Range / Values | Notes |
| --- | --- | --- | --- | --- |
| buttonCenterXPx | number | 280 | `0..4096` | Host-provided measured button center X |
| buttonCenterYPx | number | 160 | `0..4096` | Host-provided measured button center Y |
| buttonWidthPx | number | 220 | `1..2048` | Host-provided measured button width |
| buttonHeightPx | number | 72 | `1..2048` | Host-provided measured button height |
| buttonRadiusPx | number | 22 | `0..512` | Host-provided measured button radius |
| noiseScale | number | 0.034 | `0.01..0.08` | Scale of the plume detail field |
| swirlStrength | number | 0.74 | `0..1` | How strongly the smoke curls before detaching |
| driftSpeed | number | 0.22 | `0..1` | Advection speed for the smoke field |
| idleAmount | number | 0.56 | `0..1.25` | Base idle smoke density |
| idleReachPx | number | 90 | `0..180` | How far idle smoke can drift after it escapes the button |
| centerSourceScaleX | number | 0.34 | `0.1..1` | Idle source ellipse width as a fraction of half button width |
| centerSourceScaleY | number | 0.22 | `0.1..1` | Idle source ellipse height as a fraction of half button height |
| centerFeatherPx | number | 10 | `0..32` | Softens face-to-exterior smoke visibility |
| underOffsetPx | number | 12 | `0..48` | Moves the hidden smoke capsule below the button |
| underHeightPx | number | 18 | `2..48` | Thickness of the hidden smoke capsule |
| underPadPx | number | 14 | `0..48` | Extends the capsule beyond the straight underside |
| whooshRadiusPx | number | 84 | `8..160` | Maximum travel distance of the smoky front |
| whooshFrontWidthPx | number | 28 | `4..64` | Width of the traveling smoky front |
| detachStartPx | number | 10 | `0..64` | Where contour attachment begins to relax |
| detachEndPx | number | 70 | `8..140` | Where plume motion fully detaches from the contour |
| riseStrength | number | 0.95 | `0..1` | How strongly the burst bends upward after release |
| burstAmount | number | 0 | `0..1` | Host-driven burst envelope strength |
| burstPhase | number | 0 | `0..1` | Host-driven burst progress |
| idleOpacity | number | 1 | `0..1` | Idle density scale |
| burstOpacity | number | 0.32 | `0..1` | Burst density scale |
| interiorOpacity | number | 0.55 | `0..1` | How much idle smoke can stay visible on the face |
| glowStrength | number | 0.18 | `0..1` | Halo intensity |
| tintA | color | `#bfdff1` | any valid hex color | Base smoke color |
| tintB | color | `#f7fdff` | any valid hex color | Highlight smoke color |

## Layer Presets

The standalone component uses the same shader twice with two authored parameter sets:

- `GHOST_OVER`: full idle smoke, some face visibility, lighter burst fringe
- `GHOST_UNDER`: faint idle haze, strong burst body, no face visibility

The click burst is a separate under-button emitter, not the idle field turned up.

## Host Integration

The intended host structure is:

```html
<div class="ghost-button-host">
  <canvas class="ghost-fx ghost-fx--under"></canvas>
  <button class="ghost-button">Sign up</button>
  <canvas class="ghost-fx ghost-fx--over"></canvas>
</div>
```

The `GhostWhooshButton` React component owns the measurement and host-driven burst timeline internally. The low-level effect can still be rendered directly when another host wants to drive geometry and burst state itself.

## Motion And Interaction

- Idle smoke is born in a center ellipse, not on the perimeter shell.
- Near the button boundary the flow briefly follows the rounded contour, then detaches and rises.
- Click uses a hidden capsule below the button and a traveling front term to push stored smoke outward before it bends upward.
- The idle emit drops to zero during the whoosh, stays off briefly after the burst ends, then eases back in so the smoke reads as having been blown away and re-formed.
- The component keeps the DOM button visible during the burst timeline; if the click immediately navigates away, a short action delay or page transition is still needed for the whoosh to read.

## Conformance Cases

- `ghost-whoosh-default`: default params in a 560x320 host with a centered 220x72 button
- `under-capsule-burst`: `burstAmount=1`, `burstPhase=0.18`, overlay-like tints, and under-button capsule source
- `interior-fade`: lower `interiorOpacity` to keep the label area clearer
- `static-host`: animation disabled with deterministic output
