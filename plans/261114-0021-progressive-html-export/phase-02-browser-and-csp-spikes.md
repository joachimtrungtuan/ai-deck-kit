# Phase 02 — Spikes S1-S7 (browser + CSP behaviour)

## Context
- Spec §14 OQ-1, OQ-3, OQ-4, OQ-7, OQ-8, OQ-9, OQ-11, OQ-12; §13 stop-and-ask list.
- Throwaway fixtures under `plans/261114-0021-progressive-html-export/spikes/` (never in `engine/`). Results in `plans/261114-0021-progressive-html-export/reports/spike-results-progressive-export.md`.

## Overview
Priority P1. Status completed. Gates phases 03-08. No product code.

## Key insight
Vite singlefile emits an inline `<script type="module">`. Module scripts are deferred until the whole document is parsed, so the app cannot start while trailing data blocks stream — this would defeat FR-31. A classic (IIFE) script placed in `<body>` after `#root` and the loader markup, before the data blocks, runs immediately.

## Spikes

| ID | Question | Method | Pass evidence | Fail → |
|----|----------|--------|---------------|--------|
| S1 | Progressive `text/plain` parse (OQ-1, FR-31) — module vs IIFE | Fixture: loader + script + 40 blocks of ~300 KB base64. Serve via a tiny trickle server (Node `http`, ~1 MB/s, spike-only) on a fixed port; open in Chrome and Safari. Variant A inline module, variant B inline IIFE in body + MutationObserver reading each block when its next sibling appears. | Variant B: slides 1-4 blocks read and decoded before the last block arrives (timestamps logged to page + screenshot) in both browsers | Stop-and-ask (spec §13 first bullet). Fallback options to present: one block per slide fetched as later chunks is forbidden (FR-14), so offer web mode only or a reduced first-paint set. |
| S2 | `img-src 'self'` under `file://` (OQ-4, FR-42) | Fixture HTML with meta CSP `img-src data: 'self'` and `<img src="assets/a.png">`, double-click open in Chrome + Safari + Firefox | Image renders, no violation | Adding `file:` is a scheme source → stop-and-ask (FR-73 wildcard rule) |
| S3 | Template CSS `url()` / string background props (OQ-7) | grep shipped templates + Marusei template; run a Phase-01 build and inspect | Every asset reference resolves via table | Stop-and-ask (template paths unresolvable) |
| S4 | `style=""` attributes and dynamic styles (OQ-8) | Build shipped templates + Marusei with strict CSP (hashes only); load; collect violations. Check literal `style=` in emitted markup, `setAttribute('style')`, the `STILL_FRAME_CSS` insertion (`fixed-slide-canvas.tsx:73`, `presenter/mirror-frame.tsx:80`), and that the about:blank canvas iframe inherits the CSP with cloned `<style>` matching hashes. Also confirm external fonts (OQ-9): Marusei `styles/base.css` L1 Google Fonts `@import` known. | Only known items violate; each has a planned fix | Strict `style-src` breaks a template → stop-and-ask |
| S5 | Headless violation read-back (OQ-3) | Hashed first-inline script registers `securitypolicyviolation` listener, writes JSON to `html[data-csp-violations]` and sets `data-csp-check="ran"`; inject a known violation; run Chrome `--headless=new --virtual-time-budget=5000 --dump-dom`; also listen in the canvas iframe document and forward. | Dump contains marker + violation (iframe one too) | Try `--enable-logging=stderr`; if neither, report to user |
| S6 | PDF under CSP (OQ-11) | Load `index.html?print` with fixture CSP via current `export-pdf.mjs` flags | All pages captured, zero violations; note print must await all assets | Record the needed allowance; stop-and-ask if it widens CSP |
| S7 | Web-mode script inline vs external (OQ-12) | Same IIFE build, data table maps path→path | Inline hash works over `file://` | External needs `'self'` script → confirm decision f |

Informational (not gating): nginx gzip on large base64 — note only.

## Related code files
- Create only spike fixtures and the results report inside the plan folder.

## Steps
1. Build fixtures per row; record browser versions.
2. Run each; capture screenshots/dumps as evidence in the report.
3. For each fail, write the stop-and-ask item to the caller; do not continue to dependent phases.
4. Kill the trickle server when done (track PID/port).

## Tests
Spikes are evidence, not suite tests. Assertions recorded in report with raw output.

## Validation
Repo gates unchanged (no product edits): `npm test`, `npm run build:check`, `npm run lint`, `npm run typecheck`, `npm run validate`.

## Todo
- [x] S1 Chrome
- [x] S1 Safari
- [x] S2
- [x] S3
- [x] S4
- [x] S5
- [x] S6
- [x] S7
- [x] report

## Success criteria
Every row has pass/fail + evidence; every fail raised to user before Phase 03.

## Risks / rollback
Safari automation is manual. Nothing to roll back (no product changes).

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/spike-results-progressive-export.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
