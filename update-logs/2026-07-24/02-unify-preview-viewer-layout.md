# Unify preview viewer layout

## What changed

- Routed served decks and templates through the same read-only review shell.
- Replaced the template dropdown with a dedicated template-gallery page that links into the viewer.
- Kept the template viewer focused on one template and its slide list, with navigation back to the gallery.
- Fixed the viewing stage to the viewport and centered slides on a reusable 1600x900 canvas.
- Made the slide list scroll independently when its items overflow.
- Preserved the standalone export navigator while reusing the same fixed-canvas renderer.
- Added a regression test for deck serve routing.

## Why

VIVIMOON deck preview used the export-only screen shell without its styles, producing a tiny clipped viewer. The template viewer also grew with its slide list and resolved viewport-based template typography against the browser instead of the slide canvas.

## Follow-ups

- None.
