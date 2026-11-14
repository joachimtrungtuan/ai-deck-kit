# Phase 07 — External-source scan, allowances, Google Fonts embed

## Context
- FR-70..79, AC-8. Decisions a, g (licence checked at authoring time; export warn-only). OQ-9: Marusei `template/styles/base.css` L1 `@import url("https://fonts.googleapis.com/css2?...")`; shipped templates use manifest `fontImports` (`renderFontImports`, `vite-deck-plugin.ts` L344).
- Known false-positive candidates: SVG `xmlns="http://www.w3.org/2000/svg"` in template assets; internal `url(#id)` refs (Marusei `data-slides.tsx:889`).

## Overview
Priority P1. Status completed. Decisions a and g resolved.

## Requirements
- FR-70 scan deck folder, resolved template bundle, template manifest; never the minified engine bundle.
- FR-71 mapping table (CSS `url()`/`@import`/`@font-face` and manifest fonts → `style-src`/`font-src`; `content.md` + `preview-props.json` `src`/`href` → `img-src`/`media-src`/`frame-src`; layout `<script src>` → `script-src`).
- FR-72 unclassifiable source → fail naming it (stop-and-ask surface). FR-73 exact origins only, no wildcards. FR-74 any `http:` fails. FR-75 print each allowance with directive and source file.
- FR-76 Google Fonts CSS + font files downloaded at export, embedded as `data:`; no Google origins allowed. FR-77 export warns (does not block) when a font's `fsType` restricts embedding. FR-78 template validator fails on a restricted or unreadable font licence. FR-79 deck validator runs the same check on the pinned `template/` snapshot.

## Architecture
- `engine/skills/presentation-crafting/scripts/export-html-source-scan.mjs` (~150 lines): returns `{ allowances: [{directive, origin, source}], errors }`. Ignores `data:`, relative paths, fragment `url(#..)`, XML namespace attributes.
- `engine/skills/presentation-crafting/scripts/export-google-fonts-embed.mjs` (~150 lines): resolve `fonts.googleapis.com` CSS (modern UA for woff2), download files, check OS/2 `fsType` (restricted bit 0x0002 → print a warning naming the family, still embed), rewrite to `data:` in the CSS the build consumes. Network only at export time (decision a).
- `engine/skills/presentation-template-creation/scripts/font-license-check.mjs` (~80 lines): reads OS/2 `fsType` from `.ttf/.otf/.woff2` bytes; classifies fonts: catalog keys (`FONT_CATALOG`, all @fontsource / OFL) pass without reading files; Google Fonts `@import` passes as open-licensed by Google's catalogue policy and is listed as "embedded at export"; bundled font files in the template are read and fail if restricted or unreadable. Offline only.
- `validate-template-manifest.mjs` calls it (FR-78); `validate-slide-content.mjs` calls it on the deck's pinned `template/` (FR-79). Export embedder imports the same reader for its warn-only backstop.
- Allowances feed `export-html-csp-meta.mjs` from Phase 06.

## Related code files
- Create: the two modules above, `engine/cli/tests/export-html-source-scan.test.ts`, `engine/cli/tests/export-google-fonts-embed.test.ts`, `engine/cli/tests/font-license-check.test.ts`, small real font fixtures (OFL font with fsType 0, and a copy with restricted bit set) under `engine/cli/tests/fixtures/`.
- Modify: `validate-template-manifest.mjs`, `validate-slide-content.mjs`, both skills' references (`template-authoring-workflow.md`, `quality-gate.md`) to state the check, `export-standalone-html.mjs`, `vite-deck-plugin.ts` (consume rewritten font CSS for both `@import` and `fontImports`).

## Steps
1. Scanner + classifier + origin normaliser.
2. Licence reader + validator wiring (FR-78, FR-79).
3. Font embedder; failure modes: offline → clear error naming the font (no silent CDN fallback).
4. Wire: scan → embed fonts → build → CSP with allowances → print allowances.
5. Run on shipped templates + Marusei; unclassifiable or template-needs-external-origin → stop-and-ask.

## Tests (real)
- Scanner on fixture trees: `http:` source fails (AC-8), wildcard never emitted (AC-8), unclassifiable fails (AC-8), `https://cdn.example.com:8443/x.png` → exact origin with port, xmlns/`url(#id)` ignored.
- fsType parsing on the real fixture font files; restricted bit fails both validators and only warns in export (font still embedded).
- Live Google Fonts download test runs only when network is reachable; otherwise skipped with an explicit message (not faked).

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; manual Marusei export: no Google origins in CSP, fonts render offline.

## Todo
- [x] Scanner
- [x] Licence reader + validators
- [x] Font embed + warn backstop
- [x] Wiring
- [x] Template sweep
- [x] Tests

## Success criteria
AC-8 automated; Marusei renders identical fonts offline.

## Risks / rollback
Google CSS varies by User-Agent → pin a UA string. Font payload grows size → re-check AC-1. Rollback: remove scan/embed calls; Phase 06 CSP with no allowances still valid for templates without external sources.

## Reconciled evidence — 2026-11-15
Implementation and validation complete: [phase evidence](reports/review-phase-07.md), [final manual acceptance](reports/manual-acceptance.md). Final re-review appendices supersede earlier findings; see [final plan status](reports/final-plan-status.md).
