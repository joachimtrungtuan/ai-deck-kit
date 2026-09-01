# Slide Transition Catalog v1

Slide-to-slide transitions (whole-frame, on navigation) are a separate vocabulary from the [element-animation catalog](element-animation-catalog-v1.md), selected by `animation` within a slide. Transitions use `transition`; both catalogs are capped vocabularies.

| Name | Effect |
| --- | --- |
| `none` | Hard cut. Default when nothing is configured anywhere. |
| `crossfade` | True simultaneous cross-dissolve: outgoing slide fades out while the incoming slide fades in, over the same window. |
| `blur-crossfade` | Crossfade with a soft focus pull — outgoing blurs out, incoming sharpens in. |
| `push` | Outgoing and incoming slide past each other horizontally, direction-aware (forward vs. backward navigation). |
| `zoom` | Outgoing recedes (scales up, fades), incoming grows into place. |
| `wipe` | Incoming slide reveals edge-to-edge over the outgoing one, direction-aware. |
| `iris` | Incoming slide reveals from a growing circle centered on the frame. |
| `flip` | Outgoing and incoming rotate through the vertical axis, like a card flipping, direction-aware. |
| `page-turn` | Outgoing lifts away from an edge like a turned page, direction-aware. |

## Priority

A shared-element `morph` (see the element motion catalog) always wins over a plain slide transition when both are eligible for the same navigation — the runtime checks for a resolvable morph pair first, and only falls back to the configured slide transition when none exists.

## Configuration surface

Resolved in this order, first match wins, falling back to `none`:

1. Per-slide `transition` field (deck's `content.md` / manifest) — overrides everything for that one slide.
2. `deck.json`'s `defaults.transition` — the deck-wide default, seeded from the template at deck creation.
3. `template-manifest.json`'s `defaultTransition` — the template's baseline, used at scaffold time and in template-only/gallery contexts.

## Implementation

Driven by the browser View Transitions API. The runtime (`engine/preview-app/src/slide-transition-runtime.ts`) sets `data-slide-transition` / `data-slide-direction` on the transitioning document's `<html>` element before calling `startViewTransition`; `engine/preview-app/src/slide-transitions.css` keys off those attributes to animate `::view-transition-old(root)` / `::view-transition-new(root)`. `none` never calls `startViewTransition` at all — it commits the navigation directly.
