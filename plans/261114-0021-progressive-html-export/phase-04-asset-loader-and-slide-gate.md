# Phase 04 — Asset loader, loader UI, slide gate

## Context
- FR-20..26, AC-3, AC-4. FR-6 (print waits for all assets).
- Code: `engine/preview-app/src/deck-export.tsx` (`ScreenDeck`, `PrintDeck`, `useExportBridge`), `fixed-slide-canvas.tsx`, `deck-asset-resolver.ts` (Phase 01), `export-shell.css`.

## Overview
Priority P1. Status completed. Delivery-agnostic: the loader consumes an "asset source" interface; Phase 05 plugs in data blocks (single) and image preload (web).

## Requirements
- FR-20 loader visible immediately, before any image; progress shown.
- FR-21 deck starts when every image of slides 1-4 is loaded and decoded.
- FR-22 remaining slides load in slide order after 4. FR-24 a jump re-prioritises from target (target, then following). FR-25 never re-request loaded assets.
- FR-23 navigating to a not-ready slide shows the gate on that slide, then the slide.
- FR-26 loader visible within ~1 s under throttling → loader markup + minimal CSS are static in `export.html`, not React-rendered.

## Architecture
- `engine/preview-app/src/export-asset-loader.ts` (~150 lines): per-slide path lists (from render props via resolver walk), priority queue, `prioritise(slideIndex)`, `isSlideReady(i)`, `subscribe()`, `decode` via `new Image()` + `img.decode()`, state map `pending|loading|ready|failed`. Source adapter: `getPayload(path): Promise<string>`.
- `engine/preview-app/src/export-slide-gate.tsx` (~80 lines): gate overlay for one slide; uses loader subscription.
- Static loader in `export.html` (`#export-loader` + small inline style, hashed later); app hides it once slides 1-4 ready.
- `ScreenDeck`: on navigation call `prioritise`; render gate when not ready. `PrintDeck`: render nothing until all slides ready (PDF path, OQ-11).
- Serve path: loader treats the inline table as already resolved (all ready) — one runtime, no branch per app.

## Related code files
- Create: `export-asset-loader.ts`, `export-slide-gate.tsx`, `engine/cli/tests/export-asset-loader.test.ts`.
- Modify: `deck-export.tsx`, `fixed-slide-canvas.tsx` (if gate wraps there), `export.html`, `export-shell.css`.

## Steps
1. Loader core as pure TS with an injected decode function (real `Image` in browser; tests use a real deterministic async source, not a stub of the code under test).
2. Gate component + ScreenDeck wiring (go, jump input, select all call `prioritise`).
3. Static loader markup; hide on start.
4. PrintDeck readiness wait.

## Tests (real)
- Loader ordering: 40-slide list → first batch is slides 1-4; after `prioritise(38)` next requests are 38, 39, 40, then 5..; loaded paths never re-requested; shared paths across slides fetched once.
- Readiness: slide ready only when all its paths ready.
- Browser behaviour (AC-3, AC-4) verified in Phase 08 headless run + manual Chrome DevTools throttling on Marusei web export.

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual AC-3/AC-4 (throttled "Slow 4G", jump to 38).

## Todo
- [x] Loader core
- [x] Gate
- [x] Static loader
- [x] ScreenDeck/PrintDeck wiring
- [x] Tests

## Success criteria
Ordering tests pass; AC-3, AC-4 manual pass; PDF still captures all images.

## Risks / rollback
Gate flicker on fast loads → only show gate after ~150 ms not-ready. Presenter (`present --export`) must still navigate; check bridge messages. Rollback: revert; Phase 03 output still works without loader.

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/review-phase-04.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
