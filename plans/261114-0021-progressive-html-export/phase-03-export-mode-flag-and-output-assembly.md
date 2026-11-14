# Phase 03 — `--mode single|web` flag and output assembly

## Context
- FR-10..15, AC-5, AC-6 (partial: no server config files, web has no inlined images). Decisions a, c, f.
- Code: `engine/cli/commands/output.ts` (`runExport`, L143 spawn, L145-148 PDF), `engine/skills/presentation-crafting/scripts/export-standalone-html.mjs` (100 lines), `engine/vite.export.config.ts`.

## Overview
Priority P1. Status completed. Phase 02 and decisions a, c, f resolved.

## Requirements
- FR-10 `aideck export html --mode single|web`, default `single`; any other value errors with the valid list. `export pdf` always builds single.
- FR-11 single: one `index.html`; FR-12 web: `index.html` + `assets/` with plain relative refs.
- FR-13 both open via `file://`. FR-14 no fetch/XHR. FR-15 single copies `assets/` only if decision c says so.

## Architecture
- `output.ts` parses `--mode`, passes `--mode` to the script; help text updated.
- Vite: switch output to classic IIFE (`build.rollupOptions.output.format: "iife"`, emitted in body after `#root`) per S1/S7 result; `vite.export.config.ts` reads `AIDECK_EXPORT_MODE` and passes `assetDelivery: "embedded" | "linked"` to `aideckDeckPlugin`.
- Placement gap (verify in S1/S7 before coding): Vite HTML builds emit the entry as `<script type="module">` in `<head>`, and `vite-plugin-singlefile` inlines it in place; `format: "iife"` alone does not make it a classic script after `#root`. Expect a post-build step in `export-standalone-html.mjs` (drop `type="module"`/`crossorigin`, move script to body after `#root`, before data blocks), run before the Phase 06 CSP step so hashes match the final bytes.
- Plugin: `linked` → `deckAssets` maps path→path (no payloads). `embedded` keeps Phase-01 table (Phase 05 moves it to data blocks).
- Script: web mode copies only referenced assets (decision e) into `outDir/assets`; single mode copy per decision c.

## Related code files
- Modify: `output.ts`, `export-standalone-html.mjs`, `vite.export.config.ts`, `vite-deck-plugin.ts`, `engine/preview-app/export.html` (script placement), CLI help/tests.
- Create: `engine/cli/tests/export-mode-flag.test.ts`.

## Steps
1. Flag parsing + validation + help.
2. Mode env through to Vite config and plugin.
3. IIFE output; verify no `import.meta` in `preview-app/src` (none found at planning).
4. Assemble outputs per mode; never write `.htaccess`/nginx files (FR-63, checked in Phase 06 test too).
5. Update `present --export` stale check if it keys on build options.

## Tests (real)
- Arg parsing: `single`, `web`, default, invalid value error text.
- Real fixture builds per mode: single → one HTML, payload present once; web → `assets/` holds referenced files only, HTML has no `data:image` payloads, no server config files (AC-6).
- Opening over `file://` covered by Phase 08 headless check; until then manual check (AC-5).

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual double-click both outputs in Chrome + Safari.

## Todo
- [x] Flag
- [x] Plugin delivery option
- [x] IIFE build
- [x] Output assembly
- [x] Tests

## Success criteria
AC-5 manual, AC-6 automated; existing single export unchanged visually.

## Risks / rollback
IIFE switch could break code relying on module semantics (top-level await). Mitigate: build + render test. Rollback: revert phase commits; Phase 01 behaviour remains.

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/manual-acceptance.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
