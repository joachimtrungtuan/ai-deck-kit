# Export Runtime Contract

Use this when repairing or extending the shared preview/export runtime.

## Purpose

The runtime is one shared app that ships with the engine. It exists so agents never rewrite the
fixed canvas, navigation, standalone HTML shell, or PDF capture structure per deck or per template.

## Where It Lives

`engine/preview-app/` — the only copy:

- `src/deck-export.tsx` - shared screen and print deck wrapper
- `src/export-shell.css` - viewport, controls, and print page sizing
- `src/export-main.tsx` - standalone export entry
- `src/main.tsx` - preview entry (deck, single template, or gallery)
- `src/preview-types.ts` - `PreviewSlide` / `PreviewSource` shapes
- `vite-deck-plugin.ts` - resolves the target and generates `virtual:aideck-deck`
- `export.html`, `vite.export.config.ts` - single-file export entry and config

## How A Deck Reaches The Runtime

There is no registry file and no per-deck entry to add. The CLI passes the resolved deck and
template paths to `vite-deck-plugin.ts`, which generates the virtual module `virtual:aideck-deck`
exporting `runtimeDeck`, `runtimeTemplate`, and `runtimeGallery`. The entry files import from that
module and nothing else deck-specific.

This matters: the runtime renders exactly what the CLI resolved. It must never import a template's
CSS or components by name — a hardcoded import is how a deck ends up rendered in the wrong
template's styling. All template CSS arrives through the virtual module.

## Required Contract

1. Keep one shared runtime in `engine/preview-app/`; do not scaffold per-deck or per-template apps.
2. A new deck or template needs zero runtime changes.
3. No template is named in runtime source — imports come from `virtual:aideck-deck`.
4. Screen mode renders one active slide in a fixed 1600×900 iframe.
5. The browser viewport scales the iframe; slide layout must not reflow.
6. Controls are standardized: keyboard, previous/next, number jump, and slide dropdown. The
   on-screen cluster starts visible; `Shift+I` or a deck-canvas right-click toggles it without
   disabling keyboard navigation, and screen mode suppresses the native context menu for that toggle.
7. `?print` mode renders every slide as a 1600×900 `.deck-page`.
8. PDF export depends on `.deck-page`; do not rename or remove it.
9. Standalone HTML is produced by bundling this source runtime into one inlined `index.html`.

## Standalone Rule

Using shared preview-app source does not make the exported file depend on the app at runtime.
The Vite single-file bundle must inline JavaScript, CSS, fonts, and template styles into
`export/index.html`. After export, the HTML must open over `file://` with no server and no
external `assets/` folder.

## Changing The Runtime

The runtime lives in `engine/preview-app/`, which is read-only in an installed project — see
`workspace-boundary.md`. If a deck needs custom controls or canvas behavior, record the
override in the deck's `content.md`, then **stop and report** what the runtime cannot do. The
change belongs in the kit's own repository and reaches this project through `aideck upgrade`.

Deck styling, layout, fonts, and preview fixtures are never runtime changes — they belong to
the template bundle. Check that first; the genuine runtime gaps are controls, canvas
behaviour, and export plumbing.

`templates/export-runtime/` in this skill is a **legacy snapshot** from before the `.deck` bundle
format; it still assumes a `deck-registry.tsx` and `working-files/` layout that no longer exist.
Do not copy from it. Read the live runtime instead.
