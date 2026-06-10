# 08 — Fix blank HTML export; add standalone HTML + PDF export to the skill

## What changed

**Root cause of the blank VVMoon export:** the export was a normal multi-file Vite ES-module build.
Opened by double-click (`file://`), browsers block `<script type="module">` (opaque origin → CORS),
so the JS never ran → blank page. Served over HTTP it worked, confirming a delivery-format problem.

**Fix — standalone, fixed-canvas export + PDF:**

- `presentation/preview-app/src/deck-registry.tsx` (new) — shared deck/source list; `main.tsx`
  now imports it (DRY) so dev preview and export read one source of truth.
- `presentation/preview-app/src/deck-export.tsx` (new) — clean presentation view (no sidebar):
  active slide rendered inside a fixed **1600×900 iframe** so template `vw` units resolve to the
  canvas, not the window (transform `scale()` alone does not isolate `vw`); iframe is
  `translate(-50%,-50%) scale()`-ed to fit → uniform zoom, no reflow. Keyboard nav + bottom-right
  cluster (prev/next, type-a-number jump, slide dropdown). `?print` path stacks all slides for PDF.
  iframe initialized via effect (not just `onLoad`) to avoid the src-less-iframe load race.
- `presentation/preview-app/src/export-shell.css`, `export-main.tsx`, `export.html` (new) — export
  entry; imports latin/latin-ext/vietnamese font subsets (deck is Vietnamese).
- `presentation/vite.export.config.ts` (new) — `vite-plugin-singlefile`, `base:'./'`,
  `assetsInlineLimit:max` → one self-contained HTML (JS+CSS+fonts inlined). Added
  `vite-plugin-singlefile` devDep.
- `skill-engineering/presentation-crafting/scripts/export-standalone-html.mjs` (new) — builds the
  single HTML, renames `export.html`→`index.html`, drops orphan favicon.
- `skill-engineering/presentation-crafting/scripts/export-pdf.mjs` (new) — system Chrome headless
  `--print-to-pdf` (no npm dep), throwaway profile, `?print` URL → one 16:9 page per slide.
- Skill docs: `references/export-workflow.md` (new) + `SKILL.md` (workflow step 9, scripts,
  references, intake) updated via skill-creator conventions.

Regenerated `presentation/working-files/vivimoon-website/export/index.html` (1.5MB standalone) and
`vivimoon-website.pdf` (12 pages, 16:9).

## Why

User's exported HTML was a blank page on open and needed: standalone (no server), fixed
presentation canvas (no resize reflow), keyboard + jump/dropdown nav, retained
elements/layout/animations, and a PDF deliverable for the client. The skill had no export recipe, so
every future export would repeat the bug — now scripted and documented.

## Verification

- Standalone HTML fully inlined (no external `<script>`/`<link>`); renders over HTTP with 0 app
  errors; title = correct deck; starts at slide 1.
- Resize test: inner viewport stays 1600px and title font stays 81.60px at both 1920px and 1000px
  windows — zoom only, no reflow. Centers/letterboxes cleanly when narrow.
- PDF: 12 pages, 1200×675pt (16:9), slides captured at final animation state (pages 1 & 5 checked).
- `tsc --noEmit` clean; export `vite build` succeeds.

## Follow-ups

- Other registered decks (swiss-modern, linear-dark) export via the same scripts but were not
  re-exported this session.
- Font subset list in `export-main.tsx` is latin/latin-ext/vietnamese; add subsets if a future deck
  needs other scripts (cyrillic/greek).
