# Phase 08 — Headless CSP check

## Context
- FR-80..84, AC-9, AC-10 (SM-3). S5 result decides read-back.
- Code: `export-pdf.mjs` `findChrome()` (L37, `--chrome` / `CHROME_PATH` overrides), recorder script from Phase 06.

## Overview
Priority P1. Status completed. AC-9 automated and AC-10 manual browser coverage verified; see reports/manual-acceptance.md and reports/debug-cli-browser-launch.md.

## Requirements
- FR-80 after writing, load exported `index.html` headless. FR-81 both modes; record every `securitypolicyviolation`.
- FR-82 any violation → non-zero exit naming directive + blocked URI.
- FR-83 no Chrome → one warning "CSP check skipped", export succeeds.
- FR-84 zero CSP console errors.

## Architecture
- Extract `findChrome()` to `engine/skills/presentation-crafting/scripts/find-chrome-executable.mjs`; `export-pdf.mjs` imports it (DRY).
- `engine/skills/presentation-crafting/scripts/export-html-csp-headless-check.mjs` (~100 lines): run Chrome `--headless=new --virtual-time-budget=5000 --dump-dom file://.../index.html`; parse `html[data-csp-check]` and `html[data-csp-violations]`. Marker missing → fail ("recorder did not run", fail-closed). Iframe violations forwarded by the canvas iframe listener (Phase 06/S5).
- Also run on `?print` so the PDF path is covered (OQ-11).

## Related code files
- Create: `find-chrome-executable.mjs`, `export-html-csp-headless-check.mjs`, `engine/cli/tests/export-html-csp-headless-check.test.ts`.
- Modify: `export-pdf.mjs`, `export-standalone-html.mjs`, `fixed-slide-canvas.tsx` (forward iframe violations, if not done in 06).

## Steps
1. Extract Chrome finder; PDF export unchanged.
2. Check module + wiring after CSP step, both modes, normal + print.
3. Error messages per FR-82.

## Tests (real)
- With Chrome present: fixture export passes; fixture with an injected unhashed inline `<style>` fails naming `style-src` (AC-9). Tests skip with a printed reason when no Chrome is found.
- No-Chrome path: `CHROME_PATH=/nonexistent` → warning + exit 0 (AC-9).
- Marker absent (strip recorder from a copy) → fail.

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual AC-10: open each mode in Chrome + Safari, console has zero CSP errors; Marusei passes check.

## Todo
- [x] Extract finder
- [x] Check module
- [x] Wiring
- [x] Tests and full repository gates
- [x] AC-10 manual Chrome + Safari console check

## Success criteria
AC-9 automated, AC-10 manual; total export time increase recorded.

## Risks / rollback
Virtual time budget too short for big decks → make budget scale with slide count, cap ~15 s. CI without Chrome → tests skip visibly. Rollback: remove one call in `export-standalone-html.mjs`.
