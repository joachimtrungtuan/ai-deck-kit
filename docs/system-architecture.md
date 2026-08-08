# AI Deck Kit — System Architecture

**Status:** Active architecture spec (2026-07-23). Phases 01–08 runtime, distribution, template migration, and QA are implemented.
Companion specs: `project-overview-pdr.md`, `deck-format-spec.md`, `development-roadmap.md`.

## 1. Architecture Principles

- **Agent is the runtime.** No long-running server app. Work happens via agent skills + a deterministic CLI.
- **CLI core is deterministic; skills are creative.** Boilerplate/repeatable ops → CLI. Content authoring/design → skills. Same CLI callable by user or agent.
- **Engine vs working-files are hard-separated.** Engine is upgradable; user decks are never touched by upgrades.
- **Decks are portable artifacts.** A `.deck` bundle is self-contained and git-friendly (see `deck-format-spec.md`).
- **Reuse existing runtime.** Keep the custom React preview + HTML/PDF export already built.
- **KISS/YAGNI.** Model "modules" as CLI commands + skill bundles, not heavyweight code engines.

## 2. Two-Root Workspace Model

Install creates two logical roots plus a root pointer:

```text
<project-root>/
├── ai-deck-kit.json            ← ROOT POINTER (always at project root)
├── <engine-root>/              ← engine (root or a subfolder, user's choice)
│   ├── cli/                     ← Node/TS CLI core (aideck)
│   ├── skills/                  ← skill bundles (crafting, template, generation)
│   ├── templates/               ← SHIPPED DEFAULTS ONLY (read-only) + catalogs
│   ├── preview-app/             ← shared React preview + export runtime
│   └── engine.version.json      ← pinned engine version
├── decks/                       ← user presentations (one .deck each) — user data
│   └── my-talk.deck/
└── templates/                   ← ALL authored .template bundles — user data, upgrade-safe
    └── my-brand.template/
```

- `engine/` (incl. shipped preset templates) is the only tree upgrades write to.
- `decks/` and project `templates/` are user data: never touched by upgrade; users edit here.
- **One template home:** project `templates/{name}.template/` is where every authored or customized template lives, and it stays there — there is no install step and no draft/installed distinction. `engine/templates/` holds only the defaults shipped with the toolkit: read-only, replaced wholesale on upgrade, and refused by `aideck template version --bump`. When both roots hold the same name, the project copy wins for every resolution (`serve`, gallery, deck creation, re-sync); `aideck template list` marks it `overrides shipped`. Resolution failure is an error naming both roots — never a silent fallback to a different template.
- **Legacy rescue:** `aideck upgrade` and `aideck doctor` move any non-shipped bundle left inside `engine/templates/` by the old two-location layout into project `templates/` before the engine tree is replaced, so an upgrade cannot delete a user's template.
- **Shipped presets:** `swiss-modern` and `linear-dark`.

### What ships vs user data (git boundary)

AI Deck Kit's own repo (what `npx` pulls) commits `engine/` (code + preset `.template` bundles). The CI smoke test generates a throwaway deck via `aideck new` — no real presentation is committed. It **gitignores user data** so presentations are never pushed:

```gitignore
/decks/            # user presentations
/templates/        # user-created templates
**/.build/         # generated
node_modules/
```

In a user's own project the same `.gitignore` applies: they commit `decks/` + `ai-deck-kit.json` if they choose, and gitignore `engine/` (installed/upgradable).

### Install-location flexibility (root or subfolder)

The engine may be installed **at the project root** or **in any subfolder** — user's choice at `init` time. In both cases the installer writes `ai-deck-kit.json` **at the project root**, recording the resolved engine + decks paths:

```json
{ "engineRoot": "./tools/ai-deck-kit", "decksRoot": "./decks", "engineVersion": "0.1.0" }
```

### Workspace resolution

The CLI finds the workspace by walking **up** from CWD to the nearest `ai-deck-kit.json`, then reads engine/decks paths from it. Because the pointer always lives at the project root, `cd <project-root> && aideck ...` always works regardless of where the engine physically sits. (Same discovery pattern as `.git`/`package.json`.)

## 3. Distribution & Continuous Delivery

This is a **continuous-development / CI-CD** project: the engine ships new capabilities regularly, and installed copies upgrade in place.

- **Package:** root distribution package named `ai-deck-kit`; the repository is the source of truth. Remote publication is release-workflow configuration, not a completed release.
- **Install:** `npx github:joachimtrungtuan/ai-deck-kit init [--here | --dir <subfolder>]` is the configured GitHub-source entrypoint. It runs a prerequisite preflight, scaffolds the two roots + root pointer, installs the engine at the chosen version, writes the `./aideck` project wrapper, links the engine skills into the project's agent home, and offers to register the global `aideck` launcher. Registry-backed clean-install proof remains pending.
- **Command resolution:** the registered `aideck` is a version-agnostic resolver (`engine/cli/resolver.mjs`) that walks up to the nearest `ai-deck-kit.json` and runs that workspace's engine. Registration is therefore one-time and machine-wide while execution stays project-scoped.
- **CI (engine repo):** on push/PR → lint, typecheck, run CLI + template validators, install export tools, run nested-workspace HTML/PDF export smoke tests, and verify upgrade hash safety; tagged releases pack the root distribution package.
- **Upgrade (installed copy):** `aideck upgrade [--to <version>]` pulls a newer engine into the resolved `engineRoot` only; `decks/` and project `templates/` remain untouched. Engine version pinned in `ai-deck-kit.json` + `engine.version.json`.
- **Compatibility:** engine declares which `content_schema_version`, `slide_type_catalog`, and `template_version` ranges it supports; `aideck doctor` reports mismatches and never force-migrates decks silently.

## 4. Modules (CLI commands + skill bundles)

Each module has a deterministic CLI surface and, where creative, a paired skill.

| Module | CLI (deterministic) | Skill (AI-driven) |
|---|---|---|
| **Core / orchestration** | `init`, `upgrade`, `doctor`, `config`, `list` (deck registry), workspace resolution | workflow routing |
| **Onboarding** | `link`/`unlink` (register the workspace-resolving `aideck` launcher), `skills wire` (link engine skills into `.claude`/`.agents`) | — |
| **Design primitives** | `blocks list`, `motion list`, `tokens print` (read/scaffold shared blocks + motion + tokens) | choose/compose blocks, tune motion |
| **Presentation** | `new`, `slide add/remove/move`, `anim toggle`, `transition set` (scaffold + flag flips in `content.md`/manifest) | author & edit slide content |
| **Deck maintenance** | `deck status` (drift vs source template), `deck retemplate` (re-sync one deck's frozen snapshot) | judge the diff, reconcile `content.md`, decide when to re-sync |
| **Template mgmt** | `template new`, `template validate`, `template list`, `template version --bump` | design tokens, layouts, overrides, **choosing the version bump** |
| **Removal / repair** | `remove deck`, `remove template --reassign`, `uninstall [--purge]`, `reinstall` | — |
| **Generation** | `gen scaffold` (deck skeleton from template + outline) | outline-first: input → structure → slides |
| **Export / package** | `export html`, `export pdf`, `pack` (`.deck` → zip), `unpack` (zip → `.deck`) | — |
| **Preview** | `serve` (shared preview-app) | — |
| **Annotation** | `validate` surfaces annotations | reuse existing in-content annotation policy |

**CLI ⇄ skill contract:** skills call the CLI for anything deterministic (scaffolding, validation, export) instead of re-deriving it; the CLI never calls a model. This keeps boilerplate out of the agent and creativity out of the CLI.

### 4.1 Design primitives layer (blocks · motion · tokens)

A shared layer **beneath** template sets, so every template reuses the same building blocks instead of reinventing them.

```text
engine/primitives/
├── blocks/    ← canonical block types: text, title+description, image,
│                 chart, table, icon-text card, quote, stat/KPI, list, code …
├── motion/    ← curated animation vocabulary (see §4.2)
└── tokens/    ← base design-token contract (color/type/spacing/radii/stroke/shadow)
```

- **Hierarchy:** primitives → composed by template layouts → declared per slide type. Templates apply their own token values; blocks stay shared.
- **Block catalog is versioned** (`block-catalog: v1`) alongside `slide-type-catalog`, so decks/templates pin a stable block vocabulary.
- **Structured vs prose blocks:** prose blocks (text, title+description) stay free-form in `content.md`; data blocks (chart, table, stat) carry structured fields so they render deterministically and can morph. Phase 03 validates catalog membership and required fields; full typed YAML data-schema validation remains deferred hardening.
- **Component catalog:** `engine/.storybook/` isolates every primitive under a selected template skin for author and maintainer review. Storybook is development tooling only; `engine/preview-app/` remains the shared deck preview/export runtime.

### 4.2 Motion vocabulary & morph

Small and curated — not a general animation engine.

- **Minimal entrance/emphasis animations** (e.g. `gentle-rise`, fade, `none`) from the existing approved preset set.
- **Morph** as a first-class shared-element primitive: a block on slide N and slide N+1 sharing a `morph` anchor id can tween between states (position, size, data). Primary use: charts/diagrams evolving across slides. Phase 03 established the isolated primitive demo; Phase 06 carries the behavior through the shared deck navigator.
- Motion is declared per slide/block in the deck (`animation`, `transition`, `morph` anchor) and validated against the catalog.

## 5. Rendering & Export Runtime (reused)

- Single shared **React preview app** renders any `.deck` by reading its manifest + content + assets.
- For a manifest-backed deck, the runtime resolves `deck/template/` first; when
  absent, it resolves the source template project-first
  (`templates/<set>.template/`, then `engine/templates/<set>.template/`) and
  **errors** if neither exists rather than substituting a different template. The
  selected bundle supplies its manifest, layout index, React components, CSS,
  animation CSS, and deck class, so no template-name branch is needed. Deck
  validation checks an embedded bundle's name, version, and slide-type catalog
  against `deck.json`.
- **No template is named in runtime source.** The CLI passes what it resolved to
  `preview-app/vite-deck-plugin.ts`, which generates the virtual module
  `virtual:aideck-deck` (`runtimeDeck`, `runtimeTemplate`, `runtimeGallery`).
  Hardcoded template CSS imports were the mechanism by which a deck could render
  in another template's styling; the entry files now import only from that module.
  The bare-`serve` gallery is built by resolving every visible template and
  aliasing components per entry, so same-named exports across templates cannot
  collide. A template that fails to resolve is omitted from the gallery, not fatal.
- Export reuses the existing pipeline: standalone self-contained `index.html` (bundled) and flattened raster PDF (Chrome screenshot + ImageMagick). See existing `export-runtime-contract.md`.
- Templates remain code-owned (design-system CSS + React layouts per slide type); one template set per deck.

## 6. Versioning (axes carried + extended from current system)

- `template_version` — visual template set version.
- `slide_type_catalog` — required slide-type list version (v1, v2, …).
- `block_catalog` — shared block-type vocabulary version (new; from the primitives layer).
- `content_schema_version` — `.deck` content/manifest schema version.

Old decks pinned to older catalogs stay valid; upgrades never silently retype slides or blocks.

### 6.1 Template drift & re-sync

A deck freezes a copy of its template at creation and records `{ set, version, origin }` in
`deck.json`. `origin` is provenance — which root the snapshot was taken from (`project` or
`shipped`) — so the CLI can tell "the template moved forward" apart from "the template you are
now resolving is a different one with the same name".

`aideck deck status` compares the snapshot against the live source and reports one state per deck:

| State | Meaning |
|---|---|
| `current` | Snapshot version equals the source version. |
| `behind` / `ahead` | Source moved forward / snapshot is newer than the source. |
| `source-switched` | The name now resolves from a different origin than the snapshot recorded. |
| `source-missing` | No template of that name resolves any more (a `doctor` error; the others are notes). |

This depends entirely on **agent-owned versioning discipline**: the CLI never edits template
content and never infers a bump. `presentation-template-creation` requires a `templateVersion`
bump after every edit, sized patch/minor/major by the scale of the change. An unbumped edit is
invisible drift.

`aideck deck retemplate <slug> [--to <name>]` re-syncs **one** deck. It refuses a target that
does not support every slide type the deck uses, backs the snapshot up and restores it on any
failure, and updates `deck.json` only — `content.md` is never rewritten. A major-version gap is
reported as requiring visual review. Re-sync is deliberately per-deck and agent-run: only the
agent can look at the rendered result and reconcile what moved.

### 6.2 Removal & repair

Full user control over an installed project, all destructive commands printing every target
first and requiring `--yes`, and all refusing paths at or outside the project root:

- `remove deck <slug>` — deletes one `.deck` bundle.
- `remove template <name>` — refuses shipped defaults; refuses while decks still reference the
  template unless `--reassign <name>` is given, in which case every affected deck is
  re-templated **before** the deletion. No deck is ever left pointing at a template that is gone.
- `uninstall` — removes `engine/` and the pointer, leaving `decks/` and `templates/`;
  `--purge` also removes user data.
- `reinstall` — reinstalls engine dependencies (shared with `init` and `upgrade`), the fix for a
  preview runtime broken by a partial install.

## 7. Data Flow (author a deck)

```text
user prompt ─▶ agent (skill) ─▶ aideck new (CLI scaffolds .deck from template)
                        │
                        ▼
             author content.md (+ manifest, assets)
                        │
             aideck serve ─▶ React preview (read-only review)
                        │
             aideck export html|pdf ─▶ shareable output
                        │
             aideck pack ─▶ .deck.zip (portable share)
```

## 8. Security & Safety

- CLI operates only within the resolved workspace; never writes outside `engine/` on upgrade or outside a target `.deck` on deck ops.
- No secrets in decks or engine; exports are self-contained static files.
- `aideck doctor` validates before destructive ops; no silent deck migration.

## 9. Distribution Decisions (locked 2026-07-22)

- **Install location:** engine installs at the **project root** by default (`--dir` still allows a subfolder; root pointer keeps it runnable from root either way).
- **Publish channel:** **npx-from-GitHub** — `npx github:joachimtrungtuan/ai-deck-kit init`. No npm registry account needed. AI Deck Kit lives in its **own dedicated GitHub repo** whose root *is* the engine/package. User projects gitignore `engine/` and commit `decks/` + `ai-deck-kit.json`.
- **Repo layout:** **single package** — one `package.json` at engine repo root; modules are folders, one version, one publish. Revisit workspaces only if a module needs independent versioning.

## Unresolved Questions

- None blocking; per-module PRDs live under `docs/modules/` (see `module-prd-template.md`).
