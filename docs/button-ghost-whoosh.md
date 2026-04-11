# Button Ghost Whoosh 2

Button Ghost Whoosh 2 is a review-only shader demo for a measured rounded button with center-born idle vapor and a separate under-button whoosh burst. It is exposed in the playground as a raw effect study rather than as a standalone React button component.

## What This Demo Is For

- compare this alternate whoosh shader directly against `ghost-whoosh-button`
- inspect button-local geometry, burst timing, and plume shaping in the generic shader playground
- tune the effect with authored params without changing the higher-level component API

## Preview Contract

The demo uses a real DOM button in the preview app. The app measures the button bounds and radius, writes those values back into the effect params, and drives `burstAmount` plus `burstPhase` on click. Outside the preview app, the effect can still be rendered directly by any host that provides the same geometry and burst uniforms.

## Parameters

This effect uses the same parameter family as the current whoosh study:

- measured button geometry: `buttonCenterXPx`, `buttonCenterYPx`, `buttonWidthPx`, `buttonHeightPx`, `buttonRadiusPx`
- idle field shaping: `noiseScale`, `swirlStrength`, `driftSpeed`, `idleAmount`, `idleReachPx`
- center source shaping: `centerSourceScaleX`, `centerSourceScaleY`, `centerFeatherPx`
- under-button burst shaping: `underOffsetPx`, `underHeightPx`, `underPadPx`, `whooshRadiusPx`, `whooshFrontWidthPx`
- motion split: `detachStartPx`, `detachEndPx`, `riseStrength`
- host-driven burst state: `burstAmount`, `burstPhase`
- appearance: `idleOpacity`, `burstOpacity`, `interiorOpacity`, `glowStrength`, `tintA`, `tintB`
