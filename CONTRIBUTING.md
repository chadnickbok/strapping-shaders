# Contributing

This repo contains the shader catalog, starter examples, and a reference runtime/playground.

## Rules

- Write behavior specs, not implementation transcriptions.
- Keep runtime code aligned with the documented contracts and effect semantics.
- Prefer public references, standards, papers, and independent experiments as sources.
- Cite meaningful public references when they materially shape an effect family or parameter surface.
- Keep effect specs aligned with the shared contract in [`README.md`](README.md).

## Read First

- [README.md](README.md)
- the affected shader spec in [`docs/`](docs/)

## Pull Requests

Every PR should make it obvious:

- what contract changed
- what runtime behavior changed, if the playground or components were touched
- why the change is needed
- whether schemas or examples changed
- which public references informed the change, if any

If you add or change an effect spec, update `README.md` when the change affects:

- the shared component model
- parameter naming or semantics
- export behavior
- sizing, motion, or conformance expectations
