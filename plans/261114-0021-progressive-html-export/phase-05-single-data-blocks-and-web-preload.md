# Phase 05 — Delivery per mode: single data blocks, web preload

## Context
- FR-30..33 (single), FR-40..42 (web), FR-1 (each payload once), FR-14.
- Depends on S1 (progressive parse) and S2 (`'self'` under `file://`).

## Overview
Priority P1. Status completed. Plugs real sources into the Phase-04 loader.

## Requirements
- FR-30 each slide's payloads in `<script type="text/plain" data-slide="N">` after the app script.
- FR-31 app reads blocks as they arrive; slides 1-4 never wait for the last block.
- FR-32 block = JSON `{ "assets/x": "data:..." }` only; no code.
- FR-33 escaping: payload text cannot close its script element (`</` → `<\/`, `<!--` → `<\!--`).
- FR-1: an asset shared by slides goes in the block of the first slide that uses it only; later slides reference by path.
- FR-40 web mode: no inlined payloads; FR-41 preload via `new Image()` + `decode()`; FR-42 `img-src` includes `'self'` (Phase 06 emits it).

## Architecture
- Plugin (`embedded` mode): virtual module exports per-slide path lists, empty payload table. Post-build step `engine/skills/presentation-crafting/scripts/export-html-slide-data-blocks.mjs` appends blocks before `</body>` in slide order, using the same table data written by the build to a temp JSON in `.build/` (deleted after).
- Runtime `engine/preview-app/src/export-data-block-source.ts`: MutationObserver on `document.body` (IIFE runs before blocks); a block is complete when a later sibling exists or `DOMContentLoaded` fired; parse JSON, register payloads, resolve waiting promises.
- Runtime `engine/preview-app/src/export-image-preload-source.ts`: path → same path; loader decodes it.
- Mode picked by a define (`__EXPORT_ASSET_DELIVERY__`) set in `vite.export.config.ts`.

## Related code files
- Create: `export-html-slide-data-blocks.mjs`, `export-data-block-source.ts`, `export-image-preload-source.ts`, `engine/cli/tests/export-slide-data-blocks.test.ts`.
- Modify: `vite-deck-plugin.ts`, `vite.export.config.ts`, `export-standalone-html.mjs`, `deck-export.tsx` (source selection).

## Steps
1. Block writer with escaping; first-use placement.
2. Data-block source + observer.
3. Image preload source.
4. Wire per mode; build fixture both ways.

## Tests (real)
- Escaping: payload/key containing `</script>` and `<!--` round-trips through the real writer: no `</script` or `<!--` inside block text, and `JSON.parse` of the block text returns the input (`<\/` is valid JSON).
- Fixture single build: N blocks in slide order after app script; shared image appears in one block only; total occurrences = 1 (FR-1 regression).
- Fixture web build: zero `data:image` in HTML; preload source returns relative paths.

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual: Marusei single export through the S1 trickle server in Chrome + Safari shows first slide before download completes.

## Todo
- [x] Block writer
- [x] Data-block source
- [x] Preload source
- [x] Wiring
- [x] Tests
- [x] Manual progressive check

## Success criteria
FR-30..33, FR-40..42 tests pass; AC-1 size reported (soft 15 MB target); AC-2 PDF still complete.

## Risks / rollback
Observer misses blocks parsed before it attaches → also scan existing `script[data-slide]` on start. Rollback: revert to Phase-01 inline table (still deduped).

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/review-phase-05.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
