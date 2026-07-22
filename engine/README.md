# AI Deck Kit — Engine

The upgradable half of an AI Deck Kit install. Everything here ships with the engine and is replaced wholesale on `aideck upgrade` — never edit generated output by hand, and never store user decks here.

## Layout

- `skills/` — agent skill bundles (`presentation-crafting`, `presentation-template-creation`). Source of truth; `.claude/skills/` and `.agents/skills/` symlink into this tree.
- `templates/` — shipped, upgradable template-set presets (e.g. `swiss-modern`, `linear-dark`).
- `preview-app/` — shared React preview + export runtime (Vite).
- `engine.version.json` — pinned engine version + supported content/catalog/template ranges, read by `aideck doctor`.

## CLI

Run the deterministic command surface with `node cli/index.mjs` or the installed `aideck` binary.
Deck commands keep `deck.json` and `content.md` synchronized; template and primitive commands
expose installed catalogs; output commands wrap the existing preview/export scripts and zip
packaging.

```text
aideck init --here
aideck new my-talk --template swiss-modern
aideck slide add slide-02 --type text-statement --deck my-talk
aideck validate my-talk
```

The CLI requires Node 22.6+ for built-in TypeScript stripping and makes no model or network calls.

## What lives outside `engine/`

User data — never touched by upgrade:

- `../decks/` — one `.deck` bundle per presentation.
- `../templates/` — user-authored `.template` bundles (upgrade-safe, distinct from `engine/templates/` presets).
- `../ai-deck-kit.json` — root pointer recording `engineRoot`, `decksRoot`, `engineVersion`.

See `docs/system-architecture.md` for the full workspace model.
