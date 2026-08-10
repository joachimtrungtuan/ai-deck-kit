---
name: presentation-template-creation
description: Author or evolve presentation template sets for the browser presentation system. Use when creating a new template set (design system, layouts, manifest), adding or versioning slide-type catalogs, defining per-template animation or icon policies, or bumping a template's version after an edit. Not for creating decks from content — use presentation-crafting for that.
---

# Presentation Template Creation

Author complete, versioned template sets that the `presentation-crafting` skill consumes when building decks. A template set is a full visual system: design tokens, React layouts for every slide type in its declared catalog, animation presets, icon policy, and a validated manifest.

## Workspace Boundary (read before any edit)

```text
engine/**                          READ-ONLY. Replaced wholesale on upgrade. Never write.
templates/{name}.template/**       template work goes here, and only here
decks/{slug}.deck/
├── content.md, assets/            agent-owned
└── deck.json, template/, .build/  CLI-owned — change through `aideck` commands
```

`engine/` is the toolkit itself. In an installed project it is gitignored and `aideck upgrade` replaces the whole tree, so an edit there is invisible while it exists and gone without warning afterwards. Read it freely — catalogs, shipped templates, and primitives are reference material — but never write into it. Everything a template needs lives inside its own bundle: layouts, CSS, icon policy, preview fixtures (`preview-props.json`), and typeface choices (the manifest's `fonts` array).

If a task appears to need an engine change — a font the catalog lacks, a new slide-type catalog version, a runtime capability — **stop, report exactly what is missing, and escalate to the kit's own repository.** Finish the rest of the task around the gap; do not work around the boundary. This rule does not apply inside the kit's own repository, where editing the engine is the work.

Details, including how to tell the two workspaces apart: `../presentation-crafting/references/workspace-boundary.md`.

## Scope

This skill handles template-set authoring and slide-type catalog evolution. It does NOT handle deck creation, content normalization, or deck review — switch to `presentation-crafting` for those.

## Core Principles

- One template set = one coherent style. Never blend styles within a set.
- A template implements EVERY slide type in its declared catalog version. No partial coverage.
- Slide-type catalogs are versioned and additive: never modify an existing `slide-types-vN.md`. A new catalog version is engine work — see **Slide-Type Catalogs** below.
- New templates must mirror the structural conventions of existing sets (file layout, prop shape, export pattern) so the content schema and preview runtime work unchanged.
- Slide props for a new template must be a superset of the existing shared prop shape — never rename or repurpose an inherited field.
- All CSS classes, variables, and component names carry a template-unique prefix, with global styles scoped under the template's deck class so multiple templates coexist in the preview app.
- Templates live in exactly one place: the project's `templates/{name}.template/`. `engine/templates/` holds only the defaults shipped with the toolkit — read them, copy them, never edit them in place.
- **Every edit to a template ends with a version bump.** The CLI never edits templates and never bumps for you; it only reads `templateVersion` to tell users which decks have fallen behind. Skipping the bump makes drift undetectable and silently strands decks on stale snapshots.

## Workflow

1. Gather the style brief: aesthetic direction, target presentation domain, typography constraints, accent policy.
2. Read `engine/templates/template-system.md` and the newest `engine/templates/slide-types-v*.md`; read one existing template set (e.g. `swiss-modern.template/`) as the structural reference.
3. Declare the catalog version: use the newest `slide-types-vN.md` the engine ships. If the domain genuinely needs slide types no catalog offers, stop and follow **Slide-Type Catalogs** below. See `references/template-system-and-versioning.md`.
4. Scaffold the user-owned template bundle through `aideck template new <name>`. It creates `templates/<name>.template/`; do not hand-create its manifest or base files.
5. Build its `design-system.css` (tokens + class inventory), `animation-presets.css` (re-skin the approved vocabulary with the same preset names), `icon-policy.md`, layouts, layout index, and layout contracts. Compose `engine/primitives/blocks` where a catalog block fits. Declare typefaces in the manifest's `fonts` array and any preview fixtures in `preview-props.json` — both live in the bundle.
6. Validate the completed bundle with `aideck template validate <name>`. It stays where it was authored — there is no install step and nothing is copied into the engine. When you finish an editing pass, run `aideck verify` as well: it parses every layout in the bundle and reports edits that landed outside it.
7. Bump the version to match the size of the change (see **Versioning Discipline** below): `aideck template version <name> --bump patch|minor|major`. Reading it back is `aideck template version <name>`.
8. Run all verification gates per `references/preview-and-verification.md`. The preview app discovers templates automatically — there is no registration file to edit.
9. When editing a template decks already use, run `aideck deck status` afterwards and tell the user which decks are now behind. Re-syncing is a separate, deliberate act — see `presentation-crafting`.
10. Record the work in `update-logs/` per project rules.

## Versioning Discipline (agent-owned)

A deck freezes a copy of its template at creation. The only signal that the copy is stale is `templateVersion` moving in the source. So after **every** edit, judge the scale and bump:

| Bump | When | Effect on existing decks |
|-------|------|--------------------------|
| `patch` | Cosmetic-only fix that cannot move anything: a colour value, a typo in `icon-policy.md`, a comment. | Safe to re-sync unreviewed. |
| `minor` | Additive or contained: a new layout variant, a new optional prop, spacing/type-scale tuning inside one layout. | Re-sync, then skim the deck. |
| `major` | Anything that can reposition or break content: removing or renaming a slide type, layout, variant, or prop; reworking the grid or type scale; changing a required prop's meaning. | The CLI flags it as a major change; every slide needs visual review before presenting. |

Rules that follow from this:

- Bump once per coherent edit session, not once per file touched. Pick the highest bump any single change in the session earned.
- Never bump backwards or re-use a version. Never hand-edit `templateVersion` — use the CLI so the format stays valid.
- If you are unsure between two levels, choose the higher one. A needless review is cheap; a silently broken deck is not.
- Shipped defaults in `engine/templates/` cannot be bumped in place — the CLI refuses. Copy the bundle into the project's `templates/` under a new name and version that.

## Required Output Per Template Set

```text
templates/{template-name}.template/       # the one and only home of a template
├── template-manifest.json
├── design-system.css
├── animation-presets.css
├── icon-policy.md
├── preview-props.json                    # optional preview fixtures for this template
└── layouts/
    ├── layout-index.json
    ├── react/   (index.ts, shared.tsx, one file per slide category)
    └── specs/layout-contracts.md
```

Nothing outside this folder. A template that seems to need a file elsewhere is a template asking for an engine change — report it instead.

## Slide-Type Catalogs

Catalogs are engine-owned, and a new version is not something a consumer project can produce. It requires two coordinated engine changes: the file `engine/templates/slide-types-v(N+1).md`, and an entry in `engine.version.json` → `supportedSlideTypeCatalogs`, which `aideck doctor` enforces. A catalog written anywhere else declares a version no workspace accepts.

So when a template needs slide types no shipped catalog offers:

1. **Stop.** Do not write a catalog file, and do not edit an existing one.
2. Report the gap: which types are missing, their purpose, and the required props each would need — enough for the kit to author the catalog.
3. Offer the user the two real options: build the template against the newest existing catalog now, or wait for a kit release that adds the types.

Inside the kit's own repository this is ordinary work: copy the previous catalog verbatim, append the new categories and types, register the version, and release.

## References

- `references/template-system-and-versioning.md` - Template-set requirements, manifest shape, versioning rules, controlled overrides.
- `references/template-authoring-workflow.md` - Scaffold order, file checklist, design-token requirements.
- `references/react-layout-conventions.md` - Component naming, prop superset rule, category file split, shared helpers.
- `references/preview-and-verification.md` - Previewing a template in the shared runtime and the verification gates.
- `../../primitives/tokens/base-token-contract.md` - required token aliases shared by primitive blocks.
- `../../primitives/blocks/block-catalog-v1.md` - stable block contracts for layout composition.
- `../../primitives/motion/motion-catalog-v1.md` - capped motion and morph vocabulary.

Cross-skill (canonical, do not duplicate here): `../presentation-crafting/references/workspace-boundary.md` (what may be written and how to escalate), `animation-presets.md` (approved preset vocabulary), `icon-policy.md` (icon family rules), `folder-structure.md` (repository layout), `preview-runtime.md` (shared runtime rules).

## Scripts

- `aideck template new|validate|list|version` owns deterministic template scaffolding, validation, listing, and version changes.
- `aideck deck status` reports which decks have fallen behind a template you edited.

## Reporting

When reporting back, include:

- Template name and catalog version implemented.
- Files created.
- Version before → after, and why that bump level was chosen.
- Any decks the edit put behind (`aideck deck status`).
- Manifest validation, compile, and preview verification results.
- Unresolved questions at the end, if any.
