# Element Animation Catalog v1

Element animation is selected by `animation` on a slide (default) or block (specific). Slide-to-slide movement is separately selected by `transition`; see [slide transition catalog v1](slide-transition-catalog-v1.md). `morph` is the sole bridge and wins over `transition` when matching anchors resolve.

| Name | Use |
| --- | --- |
| `none` | No entrance motion. |
| `fade` | Minimal opacity entrance. |
| `gentle-rise` | Restrained upward entrance. |
| `soft-scale` | Subtle scale-in entrance. |
| `masked-reveal` | Horizontal clipped reveal. |
| `staggered-list` | Delayed entrance for direct children. |
| `image-drift` | Subtle image-scale and rise entrance. |
| `line-draw` | Stroke-dash reveal for line-capable elements. |
| `spotlight` | Horizontal emphasis entrance. |
| `morph` | Shared-element pairing across adjacent slides; requires a morph anchor. |

The engine implements these as `primitive-anim-*` classes using `--deck-motion-base` and `--deck-motion-ease`. Templates tune those tokens and declare supported names; they do not ship animation CSS.
