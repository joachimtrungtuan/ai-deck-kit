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
| `line-draw` | Stroke-dash reveal for line-capable elements, paired with an opacity entrance so it is never a no-op on ordinary markup. |
| `spotlight` | Horizontal emphasis entrance. |
| `morph` | Shared-element pairing across adjacent slides; requires a morph anchor. |

## Motion tokens

The engine implements every name as a `primitive-anim-*` class. Templates tune motion by defining these tokens in `design-system.css` and nothing else — they declare supported names in the manifest and ship no animation CSS.

| Token | Applies to | Engine fallback |
| --- | --- | --- |
| `--deck-motion-base` | `fade`, `gentle-rise`, `soft-scale`, `staggered-list` (and its child delays) | `480ms` |
| `--deck-motion-slow` | `masked-reveal`, `image-drift`, `line-draw`, `spotlight` | `--deck-motion-base`, else `760ms` |
| `--deck-motion-ease` | every animation | `cubic-bezier(0.22, 1, 0.36, 1)` |

`--deck-motion-base` and `--deck-motion-ease` are required; a template that omits them fails bundle validation. `--deck-motion-slow` is optional and falls back to the base duration, so a two-token template stays valid and simply runs the expansive effects at its base timing.

Every token is read through a `var()` fallback, so a template that defines none of them still animates. Do not remove those fallbacks: an undefined `var()` with no fallback makes the whole `animation` declaration invalid at computed-value time, which degrades silently to `animation: none` while the manifest still advertises the animation. Validation also rejects a bridge such as `--deck-motion-base: var(--x)` when no CSS in the bundle defines `--x`.

`line-draw` additionally assumes any stroked geometry it animates declares `pathLength="1"`, which normalises the `stroke-dasharray: 1` reveal to the full path. Without it the dash is one user unit long and renders as a dashed stroke rather than a drawn one.
