# End of Session — HTML + PDF Export Pipeline

**Date:** 2026-06-10

## 1. Session goal

VVMoon website deck HTML export opened as a blank page. Investigate why (report before changing anything), then fix both the exported output and the `presentation-crafting` skill so future exports don't repeat it. Incremental adds: standalone (no-server) HTML, in-skill PDF export for client delivery, keyboard + bottom-right nav controls (prev/next, jump-by-number, dropdown), retain elements/layouts/animations from React source, fixed canvas (not responsive), faithful direct PDF capture, focused commits.

## 2. Completed (DONE)

- **Root-cause diagnosis** — blank page = Vite ES-module build over `file://` (module scripts CORS-blocked). DONE.
- **Standalone single-file HTML export** — `vite-plugin-singlefile` + `assetsInlineLimit: MAX` + `base: './'`; JS/CSS/fonts base64-inlined. Opens by double-click, no server. Files: `presentation/vite.export.config.ts`, `presentation/preview-app/export.html`, `presentation/preview-app/src/export-main.tsx`, `presentation/preview-app/src/deck-export.tsx`, `presentation/preview-app/src/export-shell.css`, `presentation/preview-app/src/deck-registry.tsx` (shared source list, DRY with `main.tsx`). DONE.
- **Fixed-canvas isolation** — active slide renders inside a fixed 1600×900 `<iframe>` zoomed via `transform: scale()`; `vw` units resolve to the canvas, not the window → no reflow on resize (verified font 81.60px identical at 1920px and 1000px). DONE.
- **Nav controls** — keyboard (Arrow/Space/PageUp-Down/Home/End) + bottom-right cluster (prev, number-jump, dropdown, next); `key={active}` replays entrance animation per slide. DONE.
- **In-skill PDF export** — `skill-engineering/presentation-crafting/scripts/export-pdf.mjs` drives system Chrome `--print-to-pdf` against `index.html?print` (PrintDeck stacks one slide/page; `@page 1600px 900px` makes print viewport match iframe → faithful). Quiet flags + throwaway profile + discarded stderr remove all noise. DONE.
- **Standalone HTML script** — `skill-engineering/presentation-crafting/scripts/export-standalone-html.mjs` (`--deck`/`--slug`/`--out`). DONE.
- **Skill docs** — `references/export-workflow.md` + `SKILL.md` updates (principles, workflow step 9, intake, references/scripts lists). DONE.
- **Regenerated VVMoon output** — `presentation/working-files/vivimoon-website/export/index.html` (~1.5MB standalone) + `vivimoon-website.pdf` (12 pages, landscape 16:9). Old `assets/**` + `favicon.svg` removed. DONE.
- **5 focused commits** — `d7cfe08` linear-dark refactor, `2d2d9f4` vivimoon deck, `e8c3cd4` export pipeline+skill, `fe81893` regenerated output, `cd03f9d` docs/logs. Working tree clean. DONE.

See `08-fix-blank-html-export-add-standalone-and-pdf.md` for the detailed change log.

## 3. In-progress

None. All requests addressed.

## 4. Key decisions

- **Single-file inlined build** over a served bundle — meets the no-server / double-click requirement.
- **iframe (not transform alone)** for the fixed canvas — `transform: scale()` does not change what `vw` resolves to; only a pinned-width viewport (iframe / print page) isolates the template's viewport-unit sizing.
- **Chrome `--print-to-pdf`, not a pixel screenshot** — Chrome 149's CLI dropped `--screenshot` and `--dump-dom` (non-functional under both headless modes). Print render is faithful here (same components/CSS; print page width 1600px → `vw` matches the on-screen iframe). A literal pixel screenshot would require adding Playwright + a browser download.
- **`deck-registry.tsx` as single source** for dev preview and export (DRY).

## 5. Files touched

Created: `vite.export.config.ts`, `preview-app/export.html`, `preview-app/src/export-main.tsx`, `preview-app/src/deck-export.tsx`, `preview-app/src/export-shell.css`, `preview-app/src/deck-registry.tsx`, `presentation-crafting/scripts/export-standalone-html.mjs`, `presentation-crafting/scripts/export-pdf.mjs`, `presentation-crafting/references/export-workflow.md`, `vivimoon-website/export/{index.html,vivimoon-website.pdf}`, update logs `07`/`08`/`09`.
Modified: `preview-app/src/main.tsx` (use shared registry), `presentation/package.json` (singlefile dep), `presentation-crafting/SKILL.md`, `.gitignore` (playwright-output/).
Deleted: old `vivimoon-website/export/assets/**`, `favicon.svg`.

## 6. Unresolved questions / blockers

- **PDF capture method** — current PDF uses Chrome's print engine (visually equivalent to HTML). User asked for a "faithful, direct capture"; print render satisfies this. Open option offered, not yet answered: add Playwright for a literal pixel-screenshot PDF if the user prefers that over print render.
- Earlier offer to re-export swiss-modern + linear-dark template decks with the new pipeline — never confirmed; not required.

## 7. Pickup pointer

If the user wants the literal-screenshot PDF, add Playwright and drive cached Chromium to screenshot each `?print` slide; otherwise the export pipeline is complete. To re-export any deck: `node skill-engineering/presentation-crafting/scripts/export-standalone-html.mjs --slug <slug>` then `export-pdf.mjs --slug <slug>`.
