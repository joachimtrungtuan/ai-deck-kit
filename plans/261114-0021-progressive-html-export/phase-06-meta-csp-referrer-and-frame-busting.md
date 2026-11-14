# Phase 06 — Meta CSP, referrer, frame-busting, server-headers note

## Context
- FR-50..52, FR-60..63, AC-7, AC-6 (no server config files). Decisions b, f, h. S4/S6 results.
- Code: `export-standalone-html.mjs`, `fixed-slide-canvas.tsx:73` and `presenter/mirror-frame.tsx:80` (dynamic `STILL_FRAME_CSS` style), `mirror-frame.tsx:85` (presenter frames the export).

## Overview
Priority P1. Status completed.

## Requirements
- FR-50/51 meta CSP per spec §7.1 table, per mode (`img-src data:` single; `data: 'self'` web). `script-src`/`style-src` hashes only; no `'unsafe-inline'`/`'unsafe-eval'`. `connect-src` per decision b.
- FR-52 no `frame-ancestors`, `sandbox`, `report-uri` in meta.
- FR-60 `<meta name="referrer" content="no-referrer">`.
- FR-61 inline frame-buster before the app (hashed). Per decision h: act only when framed cross-origin (accessing `top.location.href` throws), so `aideck present --export` keeps working.
- FR-62 print one line: `frame-ancestors`/`X-Frame-Options` must be set as server headers.
- FR-63 never write `.htaccess` or other server config.

## Architecture
- `engine/skills/presentation-crafting/scripts/export-html-csp-meta.mjs` (~120 lines): input final HTML + mode + allowances (Phase 07, empty for now). Hashes (SHA-256, base64) every inline `<script>` without `src` and not `type="text/plain"`, and every `<style>`. Inserts right after `<meta charset>`: CSP meta, referrer meta, frame-buster script. Runs last, after data blocks.
- Remove dynamic style insertion: ship the still-frame rule in `export-shell.css` as `html[data-still-frame] ...` and set the attribute (canvas iframe + presenter mirror). Same runtime for serve.
- Frame-buster also hosts the `securitypolicyviolation` recorder used in Phase 08 (one hashed script).

## Related code files
- Create: `export-html-csp-meta.mjs`, `engine/cli/tests/export-html-csp-meta.test.ts`.
- Modify: `export-standalone-html.mjs`, `fixed-slide-canvas.tsx`, `presenter/mirror-frame.tsx`, `export-shell.css` (and any CSS that defines still-frame rules), `export.html`.

## Steps
1. Still-frame refactor (attribute, no injected style); verify presenter still freezes.
2. CSP builder + inserter; directive table as data in one place.
3. Referrer + frame-buster + headers note line.
4. Run S4 strict-CSP check against shipped templates + Marusei; any template break → stop-and-ask.

## Tests (real)
- Builder: exact CSP string per mode against spec §7.1; hashes equal `crypto.createHash('sha256')` of emitted inline text; `text/plain` blocks not hashed; no forbidden directives (AC-7, FR-52).
- Fixture builds: meta order (charset → CSP → referrer → buster); no server config files in output (FR-63); headers note printed once.

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual: open both modes + `aideck present --export` + `aideck export pdf` with zero console CSP errors.

## Todo
- [x] Still-frame attribute
- [x] CSP module
- [x] Referrer/buster/note
- [x] Template strict check
- [x] Tests

## Success criteria
AC-7 automated; presenter and PDF unaffected.

## Risks / rollback
Missed inline style/script → blank page. Phase 08 check catches it automatically; until then manual. Rollback: skip the CSP step in the script (single call site).

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/review-phase-06.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
