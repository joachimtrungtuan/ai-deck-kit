# Motion Catalog v1

The vocabulary is capped. Templates may tune timing and easing through base tokens but may not add unregistered behavior.

| Name | Use |
| --- | --- |
| `none` | No entrance or emphasis motion. |
| `fade` | Minimal opacity entrance. |
| `gentle-rise` | Default restrained entrance. |
| `morph` | Shared-element transition between matching anchors on adjacent slides. |

`morph` is only valid when the same anchor name occurs once on each adjacent slide. The resolver pairs by anchor; the runtime clones the outgoing DOM geometry and tweens its position and size to the incoming block. If no pair resolves, the runtime falls back to the slide transition.
