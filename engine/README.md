# AI Deck Kit — Engine

The upgradable half of an AI Deck Kit install. Everything here ships with the engine and is replaced wholesale on `aideck upgrade` — never edit generated output by hand, and never store user decks here.

## Layout

- `skills/` — agent skill bundles (`presentation-crafting`, `presentation-template-creation`). Source of truth; `.claude/skills/` and `.agents/skills/` symlink into this tree.
- `templates/` — shipped, upgradable template-set presets (e.g. `swiss-modern`, `linear-dark`).
- `preview-app/` — shared React preview + export runtime (Vite).
- `engine.version.json` — pinned engine version + supported content/catalog/template ranges, read by `aideck doctor`.

## What lives outside `engine/`

User data — never touched by upgrade:

- `../decks/` — one `.deck` bundle per presentation.
- `../templates/` — user-authored `.template` bundles (upgrade-safe, distinct from `engine/templates/` presets).
- `../ai-deck-kit.json` — root pointer recording `engineRoot`, `decksRoot`, `engineVersion`.

See `docs/system-architecture.md` for the full workspace model.
