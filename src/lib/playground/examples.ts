import auroraNode from "../../../examples/shader-node/aurora-field.default.json";
import causticPoolNode from "../../../examples/shader-node/caustic-pool.default.json";
import voronoiCausticsNode from "../../../examples/shader-node/voronoi-caustics.default.json";
import buttonEmitterAuraNode from "../../../examples/shader-node/button-emitter-aura.default.json";
import buttonGhostWhooshNode from "../../../examples/shader-node/button-ghost-whoosh.default.json";
import ditheringNode from "../../../examples/shader-node/dithering.default.json";
import ghostFrameNode from "../../../examples/shader-node/ghost-frame.default.json";
import ghostWhooshButtonNode from "../../../examples/shader-node/ghost-whoosh-button.default.json";
import liquidNode from "../../../examples/shader-node/liquid-distortion.default.json";
import auroraPreset from "../../../examples/presets/aurora-field.sunrise.json";
import causticPoolGalleryPreset from "../../../examples/presets/caustic-pool.gallery-pool.json";
import causticPoolSunShelfPreset from "../../../examples/presets/caustic-pool.sun-shelf.json";
import buttonEmitterAuraFirePreset from "../../../examples/presets/button-emitter-aura.fire-button.json";
import buttonEmitterAuraGhostPreset from "../../../examples/presets/button-emitter-aura.ghost-button.json";
import buttonGhostWhooshPreset from "../../../examples/presets/button-ghost-whoosh.pressure-sweep.json";
import ditheringAnalogPreset from "../../../examples/presets/dithering.analog-sphere.json";
import ditheringDigitalPreset from "../../../examples/presets/dithering.digital-plate.json";
import ditheringHeroPreset from "../../../examples/presets/dithering.hero-inspection.json";
import ghostFramePreset from "../../../examples/presets/ghost-frame.seance-card.json";
import ghostWhooshButtonPreset from "../../../examples/presets/ghost-whoosh-button.spectral-cta.json";
import liquidPreset from "../../../examples/presets/liquid-distortion.gentle-distortion.json";
import pulseTraceNode from "../../../examples/shader-node/pulse-trace-border.default.json";
import pulseTracePreset from "../../../examples/presets/pulse-trace-border.arcade-cta.json";
import voronoiCausticsBrightPreset from "../../../examples/presets/voronoi-caustics.bright-lattice.json";
import voronoiCausticsQuietPreset from "../../../examples/presets/voronoi-caustics.quiet-web.json";
import samplePhotoUrl from "../../../fixtures/images/sample-photo.png";
import { effectRegistry, effectOrder } from "../registry";
import type { EffectId, EffectPreset, ShaderNodePayload } from "../types";

const SAMPLE_IMAGE_ASSETS = {
  sourceImage: "fixtures/images/sample-photo.png"
} as const;

export const fixtureAssets = {
  "fixtures/images/sample-photo.png": samplePhotoUrl
} as const;

function createNode(
  effectId: EffectId,
  width: number,
  height: number,
  options?: {
    params?: Record<string, unknown>;
    seed?: string | number;
    assets?: Record<string, string>;
    rotation?: number;
  }
): ShaderNodePayload {
  return {
    id: `node-${effectId}-default`,
    type: "shader",
    effectId,
    frame: {
      width,
      height,
      ...(options?.rotation !== undefined ? { rotation: options.rotation } : {})
    },
    params: options?.params ?? (effectRegistry[effectId].defaults as Record<string, unknown>),
    ...(options?.seed !== undefined ? { seed: options.seed } : {}),
    ...(options?.assets ? { assets: options.assets } : {})
  };
}

function defaultPreset(effectId: EffectId): EffectPreset {
  return {
    name: "Default",
    effectId,
    description: "Matches the effect definition defaults.",
    params: effectRegistry[effectId].defaults
  };
}

export const defaultNodes: Record<EffectId, ShaderNodePayload> = {
  "aurora-field": auroraNode as ShaderNodePayload,
  "flowing-gradient": createNode("flowing-gradient", 1440, 900, { seed: "flow-default" }),
  "cinematic-bokeh": createNode("cinematic-bokeh", 1200, 800, {
    seed: "bokeh-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "soap-film-interference": createNode("soap-film-interference", 1200, 800, {
    seed: "soap-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "frosted-acrylic": createNode("frosted-acrylic", 1200, 800, {
    seed: "acrylic-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "moire-silk": createNode("moire-silk", 1440, 900, { seed: "moire-default" }),
  "studio-dither-fade": createNode("studio-dither-fade", 1200, 800, {
    seed: "studio-dither-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "caustic-pool": causticPoolNode as ShaderNodePayload,
  contours: createNode("contours", 1440, 900, { seed: "contours-default", rotation: 0 }),
  dithering: ditheringNode as ShaderNodePayload,
  "voronoi-caustics": voronoiCausticsNode as ShaderNodePayload,
  "holographic-foil": createNode("holographic-foil", 1200, 800, {
    seed: "foil-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "ink-bleed": createNode("ink-bleed", 1200, 800, {
    seed: "ink-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "jelly-spiral": createNode("jelly-spiral", 960, 720, { seed: "spiral-default" }),
  "lava-lamp": createNode("lava-lamp", 1200, 800, { seed: "lava-default" }),
  "liquid-distortion": liquidNode as ShaderNodePayload,
  "orbit-confetti": createNode("orbit-confetti", 1200, 800, { seed: "orbit-default" }),
  "paper-fibers": createNode("paper-fibers", 1440, 900, { seed: "paper-default" }),
  "plasma-checker": createNode("plasma-checker", 1440, 900, { seed: "plasma-default" }),
  "prism-refraction": createNode("prism-refraction", 1200, 800, {
    seed: "prism-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "riso-misprint": createNode("riso-misprint", 1200, 800, {
    seed: "riso-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "stained-glass": createNode("stained-glass", 1200, 800, {
    seed: "glass-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "star-tunnel": createNode("star-tunnel", 1440, 900, { seed: "stars-default" }),
  "thermal-bloom": createNode("thermal-bloom", 1200, 800, {
    seed: "thermal-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "truchet-neon": createNode("truchet-neon", 1440, 900, { seed: "truchet-default" }),
  "velvet-mesh": createNode("velvet-mesh", 1440, 900, { seed: "velvet-default" }),
  "vhs-poster": createNode("vhs-poster", 1200, 800, {
    seed: "vhs-default",
    assets: SAMPLE_IMAGE_ASSETS
  }),
  "ghost-frame": ghostFrameNode as ShaderNodePayload,
  "button-emitter-aura": buttonEmitterAuraNode as ShaderNodePayload,
  "button-ghost-whoosh": buttonGhostWhooshNode as ShaderNodePayload,
  "ghost-whoosh-button": ghostWhooshButtonNode as ShaderNodePayload,
  "pulse-trace-border": pulseTraceNode as ShaderNodePayload
};

export const presetsByEffect: Record<EffectId, EffectPreset[]> = {
  "aurora-field": [
    defaultPreset("aurora-field"),
    auroraPreset as EffectPreset
  ],
  "flowing-gradient": [
    defaultPreset("flowing-gradient"),
    {
      name: "Saffron Tide",
      effectId: "flowing-gradient",
      description: "Warmer, broader wave layers with a slower drift.",
      params: {
        ...effectRegistry["flowing-gradient"].defaults,
        flow: 0.28,
        waveHeight: 0.62,
        softness: 0.72,
        contrast: 0.36
      }
    }
  ],
  "cinematic-bokeh": [
    defaultPreset("cinematic-bokeh"),
    {
      name: "Night Portrait",
      effectId: "cinematic-bokeh",
      description: "Shallower focus, stronger highlight bloom, and a more anamorphic blur shape.",
      params: {
        ...effectRegistry["cinematic-bokeh"].defaults,
        focus: 0.42,
        focusSpread: 0.15,
        aperture: 0.58,
        highlightBoost: 0.76,
        anamorphic: 0.34,
        bloom: 0.42
      }
    }
  ],
  "soap-film-interference": [
    defaultPreset("soap-film-interference"),
    {
      name: "Bubble Sheet",
      effectId: "soap-film-interference",
      description: "Heavier iridescence and thickness variation over the sample image.",
      params: {
        ...effectRegistry["soap-film-interference"].defaults,
        thickness: 0.7,
        iridescence: 0.88,
        distortion: 0.46,
        drift: 0.38,
        opacity: 0.9
      }
    }
  ],
  "frosted-acrylic": [
    defaultPreset("frosted-acrylic"),
    {
      name: "Display Plaque",
      effectId: "frosted-acrylic",
      description: "Softer transmission and thicker edges for a product-surface read.",
      params: {
        ...effectRegistry["frosted-acrylic"].defaults,
        blur: 0.58,
        refraction: 0.18,
        thickness: 0.62,
        edgeGlow: 0.58
      }
    }
  ],
  "moire-silk": [
    defaultPreset("moire-silk"),
    {
      name: "Editorial Satin",
      effectId: "moire-silk",
      description: "Tighter line work with more sheen and a stronger field offset.",
      params: {
        ...effectRegistry["moire-silk"].defaults,
        lineDensity: 0.62,
        interference: 0.8,
        sheen: 0.62,
        drift: 0.16
      }
    }
  ],
  "studio-dither-fade": [
    defaultPreset("studio-dither-fade"),
    {
      name: "Proof Sheet",
      effectId: "studio-dither-fade",
      description: "Coarser cells, stronger reduction, and a more obvious paper stock.",
      params: {
        ...effectRegistry["studio-dither-fade"].defaults,
        fade: 0.62,
        pixelSize: 0.52,
        quantize: 0.66,
        paperGrain: 0.42
      }
    }
  ],
  "caustic-pool": [
    defaultPreset("caustic-pool"),
    causticPoolSunShelfPreset as EffectPreset,
    causticPoolGalleryPreset as EffectPreset
  ],
  contours: [
    defaultPreset("contours"),
    {
      name: "Atlas",
      effectId: "contours",
      description: "Tighter contour cadence with slower terrain motion.",
      params: {
        ...effectRegistry.contours.defaults,
        contourSpacing: 0.54,
        terrainScale: 0.38,
        lineWidth: 0.26,
        drift: 0.04
      }
    }
  ],
  dithering: [
    defaultPreset("dithering"),
    ditheringDigitalPreset as EffectPreset,
    ditheringAnalogPreset as EffectPreset,
    ditheringHeroPreset as EffectPreset
  ],
  "voronoi-caustics": [
    defaultPreset("voronoi-caustics"),
    voronoiCausticsBrightPreset as EffectPreset,
    voronoiCausticsQuietPreset as EffectPreset
  ],
  "holographic-foil": [
    defaultPreset("holographic-foil"),
    {
      name: "Ticket Foil",
      effectId: "holographic-foil",
      description: "Sharper scratches and brighter iridescence over the sample image.",
      params: {
        ...effectRegistry["holographic-foil"].defaults,
        iridescence: 0.82,
        scratch: 0.3,
        sparkle: 0.2
      }
    }
  ],
  "ink-bleed": [
    defaultPreset("ink-bleed"),
    {
      name: "Absorbed Poster",
      effectId: "ink-bleed",
      description: "Heavier bleed and pooling for a more soaked print read.",
      params: {
        ...effectRegistry["ink-bleed"].defaults,
        spread: 0.22,
        breakup: 0.26,
        pooling: 0.28
      }
    }
  ],
  "jelly-spiral": [
    defaultPreset("jelly-spiral"),
    {
      name: "Bubblegum Ribbon",
      effectId: "jelly-spiral",
      description: "More wraps and broader pulse for a lively gel spiral.",
      params: {
        ...effectRegistry["jelly-spiral"].defaults,
        turns: 4.2,
        pulse: 0.34,
        glow: 0.36
      }
    }
  ],
  "lava-lamp": [
    defaultPreset("lava-lamp"),
    {
      name: "Sunset Glass",
      effectId: "lava-lamp",
      description: "Warmer palette with fewer, broader blobs.",
      params: {
        ...effectRegistry["lava-lamp"].defaults,
        blobCount: 4,
        blobSize: 0.58,
        glow: 0.28
      }
    }
  ],
  "liquid-distortion": [
    defaultPreset("liquid-distortion"),
    liquidPreset as EffectPreset
  ],
  "orbit-confetti": [
    defaultPreset("orbit-confetti"),
    {
      name: "Carnival Orbit",
      effectId: "orbit-confetti",
      description: "Denser orbit systems with brighter trails.",
      params: {
        ...effectRegistry["orbit-confetti"].defaults,
        cellDensity: 0.62,
        trails: 0.32,
        speed: 0.48
      }
    }
  ],
  "paper-fibers": [
    defaultPreset("paper-fibers"),
    {
      name: "Cotton Stock",
      effectId: "paper-fibers",
      description: "Softer fibers with more blotchy paper variation.",
      params: {
        ...effectRegistry["paper-fibers"].defaults,
        fiberStrength: 0.16,
        blotches: 0.22,
        emboss: 0.16
      }
    }
  ],
  "plasma-checker": [
    defaultPreset("plasma-checker"),
    {
      name: "Electric Grid",
      effectId: "plasma-checker",
      description: "Higher warp and contrast for a louder arcade plasma field.",
      params: {
        ...effectRegistry["plasma-checker"].defaults,
        warp: 0.72,
        contrast: 0.7
      }
    }
  ],
  "prism-refraction": [
    defaultPreset("prism-refraction"),
    {
      name: "Prism Lens",
      effectId: "prism-refraction",
      description: "Deeper bend and stronger RGB split near the lens boundary.",
      params: {
        ...effectRegistry["prism-refraction"].defaults,
        refraction: 0.42,
        dispersion: 0.28,
        edgeGlow: 0.24
      }
    }
  ],
  "riso-misprint": [
    defaultPreset("riso-misprint"),
    {
      name: "Neon Poster",
      effectId: "riso-misprint",
      description: "More offset and dot structure for a louder print simulation.",
      params: {
        ...effectRegistry["riso-misprint"].defaults,
        dotScale: 0.48,
        misregisterPx: 5,
        bleed: 0.2
      }
    }
  ],
  "stained-glass": [
    defaultPreset("stained-glass"),
    {
      name: "Cathedral Poster",
      effectId: "stained-glass",
      description: "Larger panes and thicker lead lines for a more graphic mosaic.",
      params: {
        ...effectRegistry["stained-glass"].defaults,
        cellSize: 0.5,
        leadWidth: 0.24,
        bevel: 0.32
      }
    }
  ],
  "star-tunnel": [
    defaultPreset("star-tunnel"),
    {
      name: "Warp Drive",
      effectId: "star-tunnel",
      description: "Longer streaks and faster depth travel.",
      params: {
        ...effectRegistry["star-tunnel"].defaults,
        streakLength: 0.48,
        speed: 0.72,
        depth: 0.74
      }
    }
  ],
  "thermal-bloom": [
    defaultPreset("thermal-bloom"),
    {
      name: "Instrument Readout",
      effectId: "thermal-bloom",
      description: "Medical-style palette with visible contour bands and restrained bloom.",
      params: {
        ...effectRegistry["thermal-bloom"].defaults,
        palettePreset: "medical",
        contours: 0.42,
        bloom: 0.08
      }
    }
  ],
  "truchet-neon": [
    defaultPreset("truchet-neon"),
    {
      name: "Arc Maze",
      effectId: "truchet-neon",
      description: "Smaller tile system with brighter glow and stronger maze runs.",
      params: {
        ...effectRegistry["truchet-neon"].defaults,
        tileSize: 0.28,
        glow: 0.62,
        mazeBias: 0.72
      }
    }
  ],
  "velvet-mesh": [
    defaultPreset("velvet-mesh"),
    {
      name: "Editorial Wash",
      effectId: "velvet-mesh",
      description: "Broader gradient masses with more finish grain.",
      params: {
        ...effectRegistry["velvet-mesh"].defaults,
        pointSpread: 0.72,
        grain: 0.18,
        vignette: 0.16
      }
    }
  ],
  "vhs-poster": [
    defaultPreset("vhs-poster"),
    {
      name: "Broadcast Drift",
      effectId: "vhs-poster",
      description: "Heavier scanlines, wobble, and chroma error.",
      params: {
        ...effectRegistry["vhs-poster"].defaults,
        scanlines: 0.48,
        chromaShift: 0.24,
        jitter: 0.24,
        noise: 0.22
      }
    }
  ],
  "ghost-frame": [
    defaultPreset("ghost-frame"),
    {
      name: "Showcase",
      effectId: "ghost-frame",
      description: "Larger frame with inset tuned for the playground preview.",
      params: defaultNodes["ghost-frame"].params
    },
    ghostFramePreset as EffectPreset
  ],
  "button-emitter-aura": [
    defaultPreset("button-emitter-aura"),
    {
      name: "Showcase",
      effectId: "button-emitter-aura",
      description: "Preview-tuned ghost shell with the measured demo button geometry.",
      params: defaultNodes["button-emitter-aura"].params
    },
    buttonEmitterAuraGhostPreset as EffectPreset,
    buttonEmitterAuraFirePreset as EffectPreset
  ],
  "button-ghost-whoosh": [
    defaultPreset("button-ghost-whoosh"),
    buttonGhostWhooshPreset as EffectPreset
  ],
  "ghost-whoosh-button": [
    defaultPreset("ghost-whoosh-button"),
    ghostWhooshButtonPreset as EffectPreset
  ],
  "pulse-trace-border": [
    defaultPreset("pulse-trace-border"),
    {
      name: "Showcase",
      effectId: "pulse-trace-border",
      description: "Larger frame with motion tuned for the playground preview.",
      params: defaultNodes["pulse-trace-border"].params
    },
    pulseTracePreset as EffectPreset
  ]
};

for (const effectId of effectOrder) {
  if (!defaultNodes[effectId]) {
    defaultNodes[effectId] = createNode(effectId, 1440, 900);
  }

  if (!presetsByEffect[effectId]) {
    presetsByEffect[effectId] = [defaultPreset(effectId)];
  }
}

export function resolveAssetSource(source: string) {
  return fixtureAssets[source as keyof typeof fixtureAssets] ?? source;
}
