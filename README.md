# Canvas Shaders

Canvas Shaders is a shader catalog and reference runtime for React-friendly visual effects. The repo treats shaders as compositions of a few reusable graphics modules, so the documentation focuses on visual behavior, parameter semantics, and technical lineage rather than pretending each effect is a one-off algorithm.

## How The Catalog Fits Together

Most of the catalog is built from combinations of six high-level components:

- `color fields`: gradients, palette ramps, emissive bands, false-color mappings
- `noise and warps`: value noise, simplex-like fields, fBM, ridge fields, domain warping
- `signed-distance shapes`: rounded rectangles, arcs, spirals, borders, soft masks
- `tiling and cell systems`: square grids, Truchet tiles, Voronoi segmentation, per-cell hashing
- `image sampling`: refraction, chromatic splitting, halftoning, channel separation, blur
- `surface and post treatments`: bloom, grain, vignette, emboss, edge bleed, glow

Those parts recombine into the 24 shader families in [`docs/`](docs/): atmospheric backgrounds, image distortions, overlays, print treatments, and material simulations.

## Shared Contract

At the product level, every shader is described in the same shape:

- `effect`: a named visual capability
- `params`: a stable set of public controls with defaults and ranges
- `node`: an instance payload with frame, params, seed, and optional assets
- `component`: a React-facing rendering contract for an effect instance

The common React surface stays intentionally small:

```ts
type EffectComponentProps = {
  effectId: string;
  width: number;
  height: number;
  params?: Record<string, unknown>;
  seed?: number | string;
  animate?: boolean;
  time?: number;
  assets?: Record<string, string>;
  quality?: "auto" | "high" | "medium" | "low";
  className?: string;
  style?: React.CSSProperties;
};
```

Across the catalog, the docs assume a few shared rules:

- Public parameter names are part of the contract and should stay descriptive.
- Resizing should preserve the intended visual behavior, not just stretch pixels.
- `animate=false` should freeze motion cleanly.
- Fixed `seed`, `time`, inputs, and frame size should produce deterministic output when the effect is documented as deterministic.
- Export parity is behavioral: the default look, parameter meanings, and motion model should survive future runtimes even when the exact math differs.

## Source Policy

This repo is public-reference-first.

Use public articles, books, papers, demos, standards, and independent experiments to define or build effects. Cite meaningful sources when they shape a shader family or a parameter surface. Do not paste copied shader code, copied presets, or assets you do not have rights to use.

Good inputs:

- public demos and product behavior
- public shader tutorials and technical articles
- textbooks and papers on procedural texturing, rendering, and post-processing
- browser and WebGL platform documentation

Not acceptable:

- copied source code from other products or repos
- copied shader strings
- copied parameter tables or presets presented as original work
- assets or screenshots without permission

## Shader Catalog

| Shader | Primary Components | Input Type | Spec |
| --- | --- | --- | --- |
| Aurora | color field, noise warp, highlight shaping | procedural | [docs/aurora.md](docs/aurora.md) |
| Velvet Mesh | color field, grain, vignette | procedural | [docs/velvet-mesh.md](docs/velvet-mesh.md) |
| Jelly Spiral | SDF, polar transform, soft glow | procedural | [docs/jelly-spiral.md](docs/jelly-spiral.md) |
| Contours | terrain field, isolines, antialiasing | procedural | [docs/contours.md](docs/contours.md) |
| Orbit Confetti | tiling, per-cell motion, palette indexing | procedural | [docs/orbit-confetti.md](docs/orbit-confetti.md) |
| Truchet Neon | tiling, arc SDF, glow | procedural | [docs/truchet-neon.md](docs/truchet-neon.md) |
| Ghost Frame | rounded-rect SDF, center vapor, edge catch | procedural | [docs/ghost-frame.md](docs/ghost-frame.md) |
| Button Emitter Aura | button SDF, emission shell, directional wisps | procedural | [docs/button-emitter-aura.md](docs/button-emitter-aura.md) |
| Ghost Whoosh Button | layered button host, center source, under-button capsule burst | procedural | [docs/ghost-whoosh-button.md](docs/ghost-whoosh-button.md) |
| Pulse Trace Border | rounded-rect SDF, perimeter packets, glow trails | procedural | [docs/pulse-trace-border.md](docs/pulse-trace-border.md) |
| Paper Fibers | procedural texture, emboss, grain | procedural | [docs/paper-fibers.md](docs/paper-fibers.md) |
| Lava Lamp | metaballs, palette mapping, rim light | procedural | [docs/lava-lamp.md](docs/lava-lamp.md) |
| Caustic Pool | wave field, receiver focus, optional floor image | optional image | [docs/caustic-pool.md](docs/caustic-pool.md) |
| Voronoi Caustics | Voronoi ridge field, domain warp, halo | procedural | [docs/voronoi-caustics.md](docs/voronoi-caustics.md) |
| Holographic Foil | iridescence, Fresnel, scratch noise | optional image | [docs/holographic-foil.md](docs/holographic-foil.md) |
| Liquid Distortion | refraction, blur, noise field | required image | [docs/liquid-distortion.md](docs/liquid-distortion.md) |
| Riso Misprint | halftone, channel separation, overprint | required image | [docs/riso-misprint.md](docs/riso-misprint.md) |
| VHS Poster | chromatic offset, scanlines, jitter | required image | [docs/vhs-poster.md](docs/vhs-poster.md) |
| Plasma Checker | periodic basis, domain warp, palette mapping | procedural | [docs/plasma-checker.md](docs/plasma-checker.md) |
| Thermal Bloom | palette LUT, thresholding, bloom | required image | [docs/thermal-bloom.md](docs/thermal-bloom.md) |
| Stained Glass | Voronoi cells, lead lines, bevel | required image | [docs/stained-glass.md](docs/stained-glass.md) |
| Star Tunnel | radial particles, depth layers, streaking | procedural | [docs/star-tunnel.md](docs/star-tunnel.md) |
| Ink Bleed | blur, morphology, paper texture | required image | [docs/ink-bleed.md](docs/ink-bleed.md) |
| Prism Refraction | refraction, RGB split, highlights | required image | [docs/prism-refraction.md](docs/prism-refraction.md) |

## High-Level References

Foundations:

- [The Book of Shaders](https://thebookofshaders.com/)
- Ebert et al., *Texturing and Modeling: A Procedural Approach*
- [GPU Gems](https://developer.nvidia.com/gpugems/gpugems/contributors) and [GPU Gems 2](https://developer.nvidia.com/gpugems/gpugems2/contributors)
- [Inigo Quilez articles](https://iquilezles.org/articles/)
- [Lettier: 3D Game Shaders for Beginners](https://lettier.github.io/3d-game-shaders-for-beginners/)

Tools and live references:

- [Shadertoy](https://www.shadertoy.com/)
- [Three.js docs and examples](https://threejs.org/examples/)
- [Godot Shaders](https://godotshaders.com/)
- [meshgradient.com](https://meshgradient.com/)

Useful papers and specialist references already used throughout the catalog:

- [Steven Worley, A Cellular Texture Basis Function](https://cedric.cnam.fr/~cubaud/PROCEDURAL/worley.pdf)
- [Belcour and Barla, thin-film iridescence](https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html)
- [FLIR thermal palette guidance](https://www.flir.com/discover/industrial/picking-a-thermal-color-palette/)
- [Codrops on WebGL risograph techniques](https://tympanus.net/codrops/2024/06/27/digital-meets-physical-risograph-printing-with-webgl/)

## Repository Layout

- `docs/`: 24 individual shader specs
- `schemas/`: JSON schemas for shader nodes and presets
- `examples/`: example nodes and presets
- `fixtures/`: local assets and placeholders used by the playground; document provenance before shipping
- `src/`: reference React and WebGL runtime plus playground

The current playground surfaces `aurora-field`, `caustic-pool`, `voronoi-caustics`, `ghost-frame`, `button-emitter-aura`, and `liquid-distortion`. Additional effect implementations, presets, and specs remain in `src/lib/`, `examples/`, and `docs/`.

## Local Development

```bash
pnpm install
pnpm dev
```

Use `pnpm test` for the verification suite and `pnpm build` for a production bundle check.

## GitHub Pages

This repo is wired to publish the playground through GitHub Pages with a GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push the repo to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.

The workflow builds the site with:

- `VITE_BASE_PATH=/<repo-name>/`
- `VITE_REPOSITORY_URL=https://github.com/<owner>/<repo>`

That matches standard project-site publishing at `https://<owner>.github.io/<repo>/`.

If you publish from the special `<owner>.github.io` repository or a custom domain rooted at `/`, override `VITE_BASE_PATH` to `/` in the workflow.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the short contributor checklist. The rule of thumb is simple: update the spec first, keep the runtime aligned with documented behavior, and cite public technical references when they materially shape a shader.
