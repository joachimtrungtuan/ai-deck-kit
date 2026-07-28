---
name: presentation-template-creation
description: Author or evolve presentation template sets for the browser presentation system. Use when creating a new template set (design system, layouts, manifest), adding or versioning slide-type catalogs, defining per-template animation or icon policies, or registering a template in the shared preview app. Not for creating decks from content — use presentation-crafting for that.
---

# Presentation Template Creation

Author complete, versioned template sets that the `presentation-crafting` skill consumes when building decks. A template set is a full visual system: design tokens, React layouts for every slide type in its declared catalog, animation presets, icon policy, and a validated manifest.

## Scope

This skill handles template-set authoring and slide-type catalog evolution. It does NOT handle deck creation, content normalization, or deck review — switch to `presentation-crafting` for those.

## Core Principles

- One template set = one coherent style. Never blend styles within a set.
- A template implements EVERY slide type in its declared catalog version. No partial coverage.
- Slide-type catalogs are versioned and additive: never modify an existing `slide-types-vN.md`; create `v(N+1)` and leave older templates valid.
- New templates must mirror the structural conventions of existing sets (file layout, prop shape, export pattern) so the content schema and preview runtime work unchanged.
- Slide props for a new template must be a superset of the existing shared prop shape — never rename or repurpose an inherited field.
- All CSS classes, variables, and component names carry a template-unique prefix, with global styles scoped under the template's deck class so multiple templates coexist in the preview app.

## Workflow

1. Gather the style brief: aesthetic direction, target presentation domain, typography constraints, accent policy.
2. Read `engine/templates/template-system.md` and the newest `engine/templates/slide-types-v*.md`; read one existing template set (e.g. `swiss-modern.template/`) as the structural reference.
3. Decide catalog version: reuse the newest catalog, or — if the domain needs new slide types — create the next `slide-types-v(N+1).md` (copy previous catalog verbatim, append new categories/types with purpose + required props). See `references/template-system-and-versioning.md`.
4. Scaffold the user-owned template bundle through `aideck template new <name>`. It creates `templates/<name>.template/`; do not hand-create its manifest or base files.
5. Build its `design-system.css` (tokens + class inventory), `animation-presets.css` (re-skin the approved vocabulary with the same preset names), `icon-policy.md`, layouts, layout index, and layout contracts. Compose `engine/primitives/blocks` where a catalog block fits.
6. Validate and install the completed bundle through `aideck template register <name>`. The CLI validates the manifest and copies the bundle into `engine/templates/<name>.template/`; do not copy it manually.
7. Use `aideck template version <name>` to read the installed version or `aideck template version <name> --bump patch|minor|major` for an intentional version change.
8. Register the template in the shared preview app and run all verification gates per `references/preview-registration-and-verification.md`.
9. Record the work in `update-logs/` per project rules.

## Required Output Per Template Set

```text
templates/{template-name}.template/       # authored before registration
├── template-manifest.json
├── design-system.css
├── animation-presets.css
├── icon-policy.md
└── layouts/
    ├── layout-index.json
    ├── react/   (index.ts, shared.tsx, one file per slide category)
    └── specs/layout-contracts.md
```

Plus, when a new catalog version is created: `engine/templates/slide-types-v(N+1).md`.

## References

- `references/template-system-and-versioning.md` - Template-set requirements, manifest shape, versioning rules, controlled overrides.
- `references/template-authoring-workflow.md` - Scaffold order, file checklist, design-token requirements.
- `references/react-layout-conventions.md` - Component naming, prop superset rule, category file split, shared helpers.
- `references/preview-registration-and-verification.md` - Preview app registration steps and verification gates.
- `../../primitives/tokens/base-token-contract.md` - required token aliases shared by primitive blocks.
- `../../primitives/blocks/block-catalog-v1.md` - stable block contracts for layout composition.
- `../../primitives/motion/motion-catalog-v1.md` - capped motion and morph vocabulary.

Cross-skill (canonical, do not duplicate here): `presentation-crafting/references/animation-presets.md` (approved preset vocabulary), `icon-policy.md` (icon family rules), `folder-structure.md` (repository layout), `preview-runtime.md` (shared runtime rules).

## Scripts

- `aideck template new|register|list|version` owns deterministic template scaffolding, validation, installation, and version changes.

## Reporting

When reporting back, include:

- Template name and catalog version implemented.
- Files created.
- Manifest validation, compile, and preview verification results.
- Unresolved questions at the end, if any.
