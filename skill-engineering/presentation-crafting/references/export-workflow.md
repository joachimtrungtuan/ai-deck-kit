# Export Workflow

Two deliverables ship from a finished deck, both produced by scripts so every deck exports the
same way:

1. **Standalone HTML** — one self-contained `.html` file that opens by double-click, no server.
2. **PDF** — one landscape page per slide, for clients who want a flat document.

Both build from the same React source the preview app already renders, so layouts, elements, and
the template's CSS entrance animations carry over unchanged — there is no second rendering path to
drift out of sync.

## Prerequisite: register the deck

The export builds a single registered source, so the deck must be listed in
`presentation/preview-app/src/deck-registry.tsx` (the same list the dev preview reads):

```ts
{ id: "vivimoon-website", label: "VIVIMOON Website", deckClass: "ld-deck", slides: vivimoonWebsiteSlides },
```

`id` is what you pass to `--deck`. `deckClass` is the template's deck wrapper class (e.g. `ld-deck`
for linear-dark, `swiss-deck` for swiss-modern). `label` becomes the browser tab title.

## Standalone HTML

```bash
node skill-engineering/presentation-crafting/scripts/export-standalone-html.mjs \
  --deck <deck-id> [--slug <slug>] [--out <dir>]
```

Defaults: `--slug` = `--deck`; output = `presentation/working-files/<slug>/export/index.html`.

What the script does and **why it matters**:

- **Inlines everything** (JS, CSS, fonts as base64) via `vite-plugin-singlefile` with
  `assetsInlineLimit` set to max. A normal Vite build emits `<script type="module" src="...">`,
  and browsers refuse to load module scripts over `file://` (opaque origin → blocked), so a
  double-clicked multi-file build is a blank page. One inlined file has nothing to fetch, so it
  just runs.
- **`base: './'`** so any remaining relative URL resolves next to the file, not at server root.
- **Renames `export.html` → `index.html`** and drops the orphan favicon, leaving exactly one file
  to hand over.

### Fixed canvas, not a responsive page

A presentation is a fixed canvas (1600×900), not a website — it should zoom to fit the window, never
reflow. The catch: the templates size type with viewport units (`clamp(48px, 6vw, 96px)`) and have a
`max-width` media query, and a CSS `transform: scale()` does **not** change what `vw` resolves to.
So the on-screen deck renders the active slide inside a **1600×900 iframe**: inside an iframe the
viewport *is* the iframe, so `vw` is pinned to the canvas. The iframe is then `translate(-50%,-50%)
scale()`-ed to fit, giving uniform zoom with letterboxing and zero reflow. The bundled CSS is cloned
into the iframe on mount (an effect, not just `onLoad`, because a src-less iframe's `load` can fire
before React attaches the handler — that race shows up as a blank deck).

### Navigation

The standalone deck ships with: arrow / space / PageUp-Down / Home / End keyboard nav, and a
bottom-right cluster — prev, a type-a-number jump box, a slide dropdown, and next. Each navigation
remounts the slide (`key={index}`) so its entrance animation replays, matching the source.

## PDF

```bash
node skill-engineering/presentation-crafting/scripts/export-pdf.mjs \
  --slug <slug> [--out <path.pdf>] [--chrome <path>]
# or point at a built file directly: --html <path/to/index.html>
```

Run the HTML export first; the PDF script loads that file. It uses the **system Chrome/Chromium**
headless (`--print-to-pdf`) — no npm dependency, no version coupling. It auto-detects Chrome on
macOS/Linux/Windows; override with `--chrome` or `CHROME_PATH`. A throwaway `--user-data-dir` keeps
it clear of the user's real Chrome profile.

The script opens the deck with `?print`, which switches it to a stacked layout — every slide in the
main document, one per page. This is a separate path from the on-screen iframe on purpose: during
printing, Chrome's print page (`@page { size: 1600px 900px }`) becomes the viewport, so the same
`vw`-based sizing resolves correctly without the iframe. `@media print` hides the nav controls and
freezes entrance animations at their final state for a clean capture. Output is a 16:9 page per
slide (1600×900px → 1200×675pt at 96dpi).

## Validate before handoff

- HTML: open the file by **double-click** (`file://`) and confirm it renders — that is the exact
  condition that previously failed. Resize the window and confirm the deck only zooms (no reflow).
- PDF: confirm page count equals slide count and slides are not blank / mid-animation.
