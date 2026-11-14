# Export Workflow

Two deliverables ship from a finished deck, both produced through `aideck` so every deck follows the same command surface:

1. **HTML** — `single` (the default) is one self-contained file; `web` is an `index.html` plus a
   folder of referenced assets.
2. **PDF** — one landscape page per slide, for clients who want a flat document.

Both start from the same React source the preview app renders. HTML keeps the interactive deck.
PDF uses the same `?print` React render, then flattens it into images so macOS Preview can render the file cleanly.

Before editing preview/export shell code, read `references/export-runtime-contract.md`. Reuse or
restore files from `templates/export-runtime/`; do not invent a new canvas, controls, registry, or
PDF `.deck-page` structure per deck.

## CLI entry point and deck resolution

Use `aideck export html <deck-id> [--mode single|web]` or `aideck export pdf <deck-id>`. The CLI
owns deterministic export invocation; the scripts documented below are implementation details,
not the authoring workflow.

`aideck serve --deck <deck-id>` and `aideck export html|pdf <deck-id>` resolve the selected
bundle from the workspace `decks/` root. The preview runtime reads `deck.json` and `content.md`;
when a deck has legacy generated source, it is used only as a local compatibility adapter. New
decks need no registry entry or source import.

## HTML

Before Vite builds, export scans the deck and resolved template for external resource URLs. HTTP,
wildcard, or unclassifiable resource requests stop the export; each exact-origin allowance is
printed. After Vite builds, Google Fonts imports in the generated CSS are rewritten using downloaded CSS and font bytes embedded as data URLs,
so the resulting CSP contains no Google CDN origin.

```bash
aideck export html <deck-id>                 # single (default)
aideck export html <deck-id> --mode web      # folder delivery
```

Output defaults to `decks/<slug>.deck/.build/export/`. Single mode contains only
`index.html`; web mode contains `index.html` and the referenced `assets/` files.
Web mode may load those adjacent same-origin assets, but neither mode has an
external runtime dependency or makes external network requests at view time.

What the script does and **why it matters**:

- **Builds two delivery shapes** from the same classic inline app script. Single mode stores the
  rendered asset table in the HTML; web mode keeps plain `assets/` paths and emits only referenced
  files beside `index.html`.
- **Keeps progressive startup**: the loader prioritizes slides 1–4, waits for those images to
  load and decode before opening the deck, then continues in slide order. A jump to an unready
  slide gates there and re-prioritizes from the new position.
- **Scans sources before Vite builds**. HTTP, wildcard, and unclassifiable sources fail the export;
  exact origin allowances are reported. After Vite builds, Google Fonts imports in generated CSS
  are rewritten to embedded data URLs. Font `fsType` remains a warn-only export backstop;
  authoring validators block missing provenance and unreadable or restricted local fonts.
- **Applies a strict page policy**: hashed executable scripts and styles (non-executable asset blocks need no hash), mode-specific image
  sources, `font-src data: 'self'`, `connect-src 'none'`, `base-uri 'none'`, `form-action 'none'`,
  `object-src 'none'`, no-referrer, and a frame-busting fallback. A cross-origin frame first attempts top-level navigation, then refuses to render if still
  framed. Same-origin presenter frames remain supported. Server-only security headers are not written into the folder.
- **Runs the headless CSP check** for normal and print URLs when Chrome/Chromium is available;
  violations or a missing recorder marker fail the export, while missing Chrome warns and skips.
- **Uses `base: './'`** so remaining relative web-mode URLs resolve next to the file.
- **Renames `export.html` → `index.html`** and drops the orphan favicon.
- **Keeps the fixed-canvas export shell** from `engine/preview-app/src/deck-export.tsx` and
  `export-shell.css`: the active slide renders in a 1600×900 iframe, then zooms to fit.
- **Uses reusable source templates** from `templates/export-runtime/` if the runtime is missing.
  These templates are bundled into the final file; the exported HTML does not depend on the
  preview app folder at runtime.

Single HTML is finalized when a current-format deck exports to exactly one self-contained file:

```bash
node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs \
  --deck decks/<slug>.deck --out /tmp/deck-html-export-check
find /tmp/deck-html-export-check -maxdepth 2 -type f -print
```

Expected: one file (`index.html`) and no external `assets/`. For web mode, run the same command
with `--mode web` and expect `index.html` plus only referenced assets and no server configuration.
A `pack` → `unpack` round trip of a current-format deck must preserve the export shape.

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
remounts the slide (`key={index}`) so its entrance animation replays, matching the source. The
cluster starts visible; press **Shift+I** or right-click the deck canvas to hide/show it during a
screen recording. Keyboard navigation remains active while the cluster is hidden, and the export
view suppresses the native context menu for that right-click toggle.

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
