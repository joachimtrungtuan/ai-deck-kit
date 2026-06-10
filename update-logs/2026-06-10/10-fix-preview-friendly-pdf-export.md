# Fix Preview-Friendly PDF Export

## What changed

- Reworked `skill-engineering/presentation-crafting/scripts/export-pdf.mjs` from Chrome `--print-to-pdf` to a flattened capture pipeline:
  - render `index.html?print` in system Chrome
  - count rendered `.deck-page` nodes
  - capture a native 1600x900-per-slide tall screenshot
  - crop into slide images
  - assemble a lightweight PDF with ImageMagick
- Regenerated `presentation/working-files/vivimoon-website/export/vivimoon-website.pdf`.

## Why

Chrome rendered the previous PDF acceptably, but macOS Preview struggled with the heavy vector/CSS PDF and showed clipping/slow rendering. The new output is raster-flattened at slide resolution, smaller, and easier for Preview to display.

## Verification

- `node --check skill-engineering/presentation-crafting/scripts/export-pdf.mjs`
- `node skill-engineering/presentation-crafting/scripts/export-pdf.mjs --slug vivimoon-website`
- `pdfinfo presentation/working-files/vivimoon-website/export/vivimoon-website.pdf`
  - 12 pages
  - 800 x 450 pt
  - ~1.0 MB
- Rasterized final PDF with `pdftoppm` and inspected a 12-page contact sheet plus full-size page 1 and page 12.

## Follow-ups

- Patch the `presentation-crafting` skill docs later to describe the new ImageMagick-backed flattened PDF flow.
