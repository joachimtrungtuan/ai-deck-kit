# 03 — Split template authoring into presentation-template-creation skill

## What changed

- Created `skill-engineering/presentation-template-creation/` (user decision: separate skill, not extension of presentation-crafting):
  - `SKILL.md` — template-set authoring workflow, scope declaration, catalog versioning steps.
  - `references/template-system-and-versioning.md` — MOVED from presentation-crafting (template-side ownership).
  - `references/template-authoring-workflow.md` — NEW: build order, manifest checklist, design-token requirements, style discipline.
  - `references/react-layout-conventions.md` — NEW: component naming, prop-superset rule, category file split, layout-index completeness.
  - `references/preview-registration-and-verification.md` — NEW: preview app registration + 6 verification gates.
  - `scripts/validate-template-manifest.mjs` — MOVED from presentation-crafting.
- Symlinked new skill into `.claude/skills/` and `.agents/skills/`; registered in skills catalog; validator verified working from new path.
- De-overlapped `presentation-crafting`: SKILL.md description now excludes template authoring; workflow step 5 routes to new skill; removed manifest-validation step, moved ref + script entries; added cross-skill pointer. Canonical shared refs (animation-presets, icon-policy, folder-structure, preview-runtime) stay in presentation-crafting; new skill cross-references, no duplication.
- Updated stale paths: `plans/260610-0831-linear-dark-template/plan.md` (validator + pre-reading), `CLAUDE.md`, `AGENTS.md` (structure tree, skill routing, validation rule).

## Why

User wants template creation as standalone skill; clean ownership split = deck flow consumes templates, template flow authors them.

## Follow-ups

- Linear-dark plan execution will be first real test of the new skill's workflow.
- Shared refs ownership (animation/icon vocab in presentation-crafting) — revisit if template skill is ever distributed standalone.
