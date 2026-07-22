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
2. Read `engine/templates/template-system.md` and the newest `engine/templates/slide-types-v*.md`; read one existing template set (e.g. `swiss-modern/`) as the structural reference.
3. Decide catalog version: reuse the newest catalog, or — if the domain needs new slide types — create the next `slide-types-v(N+1).md` (copy previous catalog verbatim, append new categories/types with purpose + required props). See `references/template-system-and-versioning.md`.
4. Scaffold the template folder per `references/template-authoring-workflow.md`.
5. Write `template-manifest.json` and validate:
   - `node engine/skills/presentation-template-creation/scripts/validate-template-manifest.mjs <template-manifest>`
6. Build `design-system.css` (tokens + class inventory) and `animation-presets.css` (re-skin the shared preset vocabulary in `presentation-crafting/references/animation-presets.md` — same preset names, template-specific timing/easing).
7. Write the template's `icon-policy.md`, applying `presentation-crafting/references/icon-policy.md` (Phosphor-first) with template-specific treatment.
8. Map the base primitive token contract in the template deck class, then implement React layouts per `references/react-layout-conventions.md`; compose `engine/primitives/blocks` where a catalog block fits. Document layout rules in `layouts/specs/layout-contracts.md`; map every slide type in `layouts/layout-index.json`.
9. Register the template in the shared preview app and run all verification gates per `references/preview-registration-and-verification.md`.
10. Record the work in `update-logs/` per project rules.

## Required Output Per Template Set

```text
engine/templates/{template-name}/
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

- `scripts/validate-template-manifest.mjs` checks a template manifest for required template-system fields.

## Reporting

When reporting back, include:

- Template name and catalog version implemented.
- Files created.
- Manifest validation, compile, and preview verification results.
- Unresolved questions at the end, if any.
