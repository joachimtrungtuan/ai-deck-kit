# Export Workflow

Two deliverables ship from a finished deck, both produced through `aideck` so every deck follows the same command surface:

1. **Standalone HTML** — one self-contained `.html` file that opens by double-click, no server.
2. **PDF** — one landscape page per slide, for clients who want a flat document.

Both start from the same React source the preview app renders. HTML keeps the interactive deck.
PDF uses the same `?print` React render, then flattens it into images so macOS Preview can render the file cleanly.

Before editing preview/export shell code, read `references/export-runtime-contract.md`. Reuse or
restore files from `templates/export-runtime/`; do not invent a new canvas, controls, registry, or
PDF `.deck-page` structure per deck.

## CLI entry point and deck resolution

Use `aideck export html <deck-id>` or `aideck export pdf <deck-id>`. The CLI owns deterministic export invocation; the scripts documented below are implementation details, not the authoring workflow.

`aideck serve --deck <deck-id>` and `aideck export html|pdf <deck-id>` resolve the selected
bundle from the workspace `decks/` root. The preview runtime reads `deck.json` and `content.md`;
when a deck has legacy generated source, it is used only as a local compatibility adapter. New
decks need no registry entry or source import.

## Standalone HTML

```bash
aideck export html <deck-id>
```

Output defaults to `decks/<slug>.deck/.build/export/index.html`.

What the script does and **why it matters**:

- **Inlines everything** (JS, CSS, fonts as base64) via `vite-plugin-singlefile` with
  `assetsInlineLimit` set to max. A normal Vite build emits `<script type="module" src="...">`,
  and browsers refuse to load module scripts over `file://` (opaque origin → blocked), so a
  double-clicked multi-file build is a blank page. One inlined file has nothing to fetch, so it
  just runs.
- **`base: './'`** so any remaining relative URL resolves next to the file, not at server root.
- **Renames `export.html` → `index.html`** and drops the orphan favicon, leaving exactly one file
  to hand over.
- **Keeps the fixed-canvas export shell** from `engine/preview-app/src/deck-export.tsx` and
  `export-shell.css`: the active slide renders in a 1600×900 iframe, then zooms to fit.
- **Uses reusable source templates** from `templates/export-runtime/` if the runtime is missing.
  These templates are bundled into the final file; the exported HTML does not depend on the
  preview app folder at runtime.

HTML is finalized when a current-format deck exports to exactly one self-contained file:

```bash
node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs \
  --deck decks/<slug>.deck --out /tmp/deck-html-export-check
find /tmp/deck-html-export-check -maxdepth 2 -type f -print
```

Expected: one file (`index.html`) and no external `assets/`. A `pack` → `unpack` round trip of a
current-format deck must produce the same HTML output.

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
aideck export pdf <deck-id>
```

Run the HTML export first; the PDF script loads that `index.html`. It uses **system
Chrome/Chromium** plus **ImageMagick** (`magick`). Chrome is auto-detected on macOS/Linux/Windows;
override with `--chrome`. ImageMagick is found with `which magick`; override with `--imagemagick`.

The script opens the deck with `?print`, which switches to `PrintDeck`: every slide appears in the
main document as a 1600×900 `.deck-page`. Then it:

1. Dumps the rendered DOM to a temp file and counts `class="deck-page"` occurrences.
2. Screenshots the full stacked print deck at `1600 × (slideCount * 900)`.
3. Crops the tall PNG into 1600×900 slide images.
4. Assembles those images into a lightweight 16:9 PDF.

Why not `--print-to-pdf`: Chrome renders that vector/CSS PDF, but macOS Preview can lag or clip it.
The flattened image PDF is smaller and more stable for client review.

Use the progress lines as health checks:

```text
counting slides...
capturing <N> slides...
assembling PDF...
```

If the script hangs on DOM capture, do not add profile reuse. Chrome finished reliably without a
custom `--user-data-dir`; profile isolation caused hangs in local testing.

## Validate before handoff

- HTML: open the file by **double-click** (`file://`) and confirm it renders — that is the exact
  condition that previously failed. Resize the window and confirm the deck only zooms (no reflow).
- PDF metadata:
  `pdfinfo decks/<slug>.deck/.build/export/<slug>.pdf`
  Check page count equals slide count, page size is 16:9, and file size is reasonable.
- PDF visual QA: rasterize and inspect, because the PDF's value is usability, not code success.

```bash
mkdir -p /tmp/<slug>-pdf-check
pdftoppm -png -r 120 decks/<slug>.deck/.build/export/<slug>.pdf /tmp/<slug>-pdf-check/page
```

Inspect at least: a contact sheet, page 1, a dense middle page, and the final page. Confirm no
blank pages, no clipping, no mid-animation state, no cropped title, and readable content in macOS
Preview-like raster output.
