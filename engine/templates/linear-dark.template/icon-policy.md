# Linear Dark Icon Policy

Use Phosphor React icons for this template.

## Defaults

- Family: `@phosphor-icons/react`
- Weight: `regular`
- Size scale: `24`, `32`, `48`
- Stroke feeling: precise, quiet, modern SaaS — not playful

## Rules

- Use icons only for concept labels, process nodes, architecture components, or compact evidence cues.
- Prefer typography, hairline rules, and panels before adding icons.
- Do not mix icon families inside a deck.
- Do not use emoji as icon substitutes.
- Icon tiles are **rounded squares** using `--ld-radius-sm` (`.ld-icon-tile`) — sharp corners do NOT apply in this template.
- Icon color is `--ld-accent` on a panel fill, or `--ld-muted` when the icon is decorative and should sit lower in the hierarchy.
- Keep icon tiles aligned to the slide grid; one tile size per slide.
- Reserve the accent glow for at most one cluster per slide — do not let every icon glow.
- If static HTML export cannot bundle React icons, use `@phosphor-icons/web` with the same icon names and weight.

## Authoring icons (prop contract)

Slide components expose icons through two props (see `layouts/react/shared.tsx`):

- `icon?: string` — a single icon for single-slot slides (`metric-highlight`).
- `icons?: string[]` — icons parallel to `items`, one per slot (`icon-grid`, `process-flow`, `case-study`, `timeline`, `architecture-overview`).

Values are **names from the curated `ICON_MAP`**, not raw component names. Current names:

`target`, `stack`, `lightning`, `shield`, `database`, `cloud`, `branch`, `code`, `terminal`, `plugs`, `users`, `chart`, `rocket`, `lock`, `sync`, `cpu`, `globe`.

- To add an icon name, extend `ICON_MAP` in `shared.tsx` (import the Phosphor glyph, add the key). Keep names short and semantic.
- **Unset / unknown names render a dashed placeholder tile** (`.ld-icon-tile-empty`, `SquaresFour` glyph). This is intentional: it signals to authors that an icon belongs in that slot and should be filled before handoff.
- Slots that take icons: `icon-grid` (required), `process-flow`, `case-study`, `timeline`, `architecture-overview`, `metric-highlight` (optional but recommended).
