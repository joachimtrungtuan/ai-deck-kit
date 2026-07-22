# Base Token Contract

Templates provide these aliases on their deck root. Primitive components consume only this contract, never template-prefixed variables.

| Family | Required tokens |
| --- | --- |
| Color | `--deck-color-bg`, `--deck-color-surface`, `--deck-color-panel`, `--deck-color-ink`, `--deck-color-muted`, `--deck-color-accent`, `--deck-color-accent-soft` |
| Type | `--deck-font-display`, `--deck-font-body`, `--deck-font-mono` |
| Spacing | `--deck-space-1` through `--deck-space-7` |
| Shape | `--deck-radius`, `--deck-radius-sm`, `--deck-stroke`, `--deck-shadow` |
| Motion | `--deck-motion-ease`, `--deck-motion-base` |
| Code | `--deck-code-ink` |

Values remain the template’s responsibility. A template can map existing prefixed values to these aliases without changing its design system.
