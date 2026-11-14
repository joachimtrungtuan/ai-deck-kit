# Progressive export CSP and frame-busting

## What changed

- Added the export security postprocessor for strict per-mode CSP, inline script/style SHA-256 hashes, referrer metadata, a CSP violation recorder, and cross-origin-only frame-busting.
- Replaced dynamic still-frame `<style>` injection in fixed canvases and presenter mirrors with the shipped `html[data-still]` selector.
- Added focused CSP tests covering metadata ordering, exact hashes, override CSS payloads, forbidden directives, and web-mode image policy.
- Export now prints the required one-line server-header note; it writes no server configuration files.

## Why

Exported decks need a strict browser policy without unsafe-inline/eval while presenter same-origin mirrors must continue to work.

## Validation

Focused CSP/export tests, typecheck, lint, build:check, and validate pass. Full npm test and browser CSP/PDF evidence remain to the orchestrator's final gate/manual phase; Marusei Google font handling remains Phase 07 scope.
