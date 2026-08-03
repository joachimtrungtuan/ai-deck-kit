# AI Deck Kit — Engine

The upgradable half of an AI Deck Kit install. Everything here ships with the engine and is replaced wholesale on `aideck upgrade` — never edit generated output by hand, and never store user decks here.

## Layout

- `skills/` — agent skill bundles (`presentation-crafting`, `presentation-template-creation`). Source of truth; `.claude/skills/` and `.agents/skills/` symlink into this tree.
- `templates/` — the defaults shipped with the toolkit (e.g. `swiss-modern.template`, `linear-dark.template`) plus versioned catalog documents. Read-only: replaced wholesale on upgrade, and `aideck template version --bump` refuses them. User-authored templates live in `../templates/` only.
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
aideck serve my-talk
aideck serve template swiss-modern
```

`serve` accepts a bare deck slug, `deck <slug>`, `template <name>`, or the equivalent
`--deck`/`--template` flags. It opens the shared, read-only browser preview by default,
printing what it resolved (deck path, or template name + origin + version + path)
before Vite starts. Use `--no-open` for automation; omit a target to open the gallery
of every resolvable template. Naming a template where a deck is expected fails with the
correct command rather than rendering something else.

Deck maintenance and removal:

```text
aideck deck status [<slug>]                    # drift vs the source template
aideck deck retemplate <slug> [--to <name>]    # re-sync one deck's frozen snapshot
aideck remove deck <slug> --yes
aideck remove template <name> --reassign <name> --yes
aideck uninstall [--purge] --yes
aideck reinstall
```

The CLI requires Node 22.6+, runs on macOS and Linux (Windows unsupported; use WSL),
and makes no model or network calls. Sources are TypeScript under `cli/`; the shipped
artifact is compiled `cli/dist/`, kept current by `npm run build` and gated by
`npm run build:check`.

## What lives outside `engine/`

User data — never touched by upgrade:

- `../decks/` — one `.deck` bundle per presentation.
- `../templates/` — every `.template` bundle the project authors or customizes; the single home for template work. A bundle here shadows a shipped default of the same name.
- `../ai-deck-kit.json` — root pointer recording `engineRoot`, `decksRoot`, `engineVersion`.

See `docs/system-architecture.md` for the full workspace model.
