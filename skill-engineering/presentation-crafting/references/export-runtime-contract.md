# Export Runtime Contract

Use this when creating or repairing preview/export infrastructure for any deck.

## Purpose

The export runtime is reusable source code, not a runtime dependency. It prevents agents from
rewriting the fixed canvas, navigation, standalone HTML shell, or PDF capture structure per deck.

## Template Files

Copy or compare from `templates/export-runtime/`:

- `deck-export.tsx` - shared screen and print deck wrapper
- `export-shell.css` - viewport, controls, and print page sizing
- `export-main.tsx` - standalone export entry
- `deck-registry.tsx` - registered deck/source shape
- `export.html` - Vite HTML entry
- `vite.export.config.ts` - single-file export config

## Required Contract

1. Keep one shared runtime in `presentation/preview-app/`; do not scaffold per-deck apps.
2. New decks only add slide source and a `deck-registry.tsx` entry.
3. Screen mode renders one active slide in a fixed 1600×900 iframe.
4. The browser viewport scales the iframe; slide layout must not reflow.
5. Controls are standardized: keyboard, previous/next, number jump, slide dropdown.
6. `?print` mode renders every slide as a 1600×900 `.deck-page`.
7. PDF export depends on `.deck-page`; do not rename or remove it.
8. Standalone HTML is produced by bundling this source runtime into one inlined `index.html`.

## Standalone Rule

Using shared preview-app source does not make the exported file depend on the app at runtime.
The Vite single-file bundle must inline JavaScript, CSS, fonts, and template styles into
`export/index.html`. After export, the HTML must open over `file://` with no server and no
external `assets/` folder.

## When To Copy Templates

- If `presentation/preview-app/src/deck-export.tsx` or `export-shell.css` is missing, copy the
  template first, then adapt only imports and template-specific slide selectors.
- If the files exist, patch them instead of creating a second runtime.
- If a deck needs custom controls or canvas behavior, record the override in the canonical content
  file before changing the shared runtime.
