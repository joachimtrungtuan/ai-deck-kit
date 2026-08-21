# Phase 4 (resizable/collapsible sidebar) complete

## What changed

- Implemented drag-resizable (`[200, 480]`px) and collapsible left sidebar in the live-editing preview (`engine/preview-app/src/main.tsx`, `preview-shell.css`), with width/collapsed state persisted to `localStorage`.
- Added automated source-pattern test in `engine/cli/tests/serve.test.ts` confirming the sidebar behavior and that the export viewer (`deck-export.tsx`/`export-shell.css`) is unaffected.
- Updated `docs/modules/preview-module-prd.md` to note the preview now persists local UI prefs to `localStorage` (previously "no writes").
- Marked Phase 4 and the plan's matching success criterion as Completed in `plans/260820-0942-kit-reliability-fixes-.../{plan.md, phase-04-resizable-collapsible-left-sidebar.md}`.

## Why

Last of 4 independent reliability fixes in the active plan; all 34 tests pass, typecheck clean.

## Follow-ups

- Manual browser verification of drag feel/bounds, collapse/expand, and reload-persistence not yet done. Per user decision (2026-08-21), this doesn't block completing the phase — user will test directly and report anything to fix as a separate follow-up.
