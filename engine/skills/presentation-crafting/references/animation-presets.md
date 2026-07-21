# Animation Presets

Animations should add pacing and attention without making the deck feel busy.

## Presets

| Preset | Use |
| --- | --- |
| `none` | Dense content, accessibility-sensitive decks, or static export checks. |
| `gentle-rise` | Default slide entrance: opacity plus small vertical transform. |
| `soft-scale` | Hero objects, diagrams, or one strong visual. |
| `masked-reveal` | Title slides, section dividers, and major transitions. |
| `staggered-list` | Bullet lists, icon grids, and framework steps. |
| `image-drift` | Subtle movement for large images or background media. |
| `line-draw` | Process flows, diagrams, or technical grid treatments. |
| `spotlight` | One metric, quote, or key object. |

## Rules

- Template sets define a default animation.
- Slide-level override is allowed only with a recorded reason.
- Animate `transform` and `opacity`; avoid layout-triggering properties.
- Respect `prefers-reduced-motion`.
- Keep transitions under control for live presenting: no long waits before content becomes readable.

## Pacing

Use stronger animation at:

- title
- section divider
- major reveal
- closing

Use quieter animation for:

- detailed text
- data
- diagrams
- dense teaching slides
