# AI Deck Kit — Vision Specs & Migration Plan

**Date:** 2026-07-22

## What changed
Re-scoped the project from an enclosed React "AI Presentation" workspace into **AI Deck Kit** — a portable, agent-native presentation toolkit. Produced spec docs + a full migration plan. No code/folder restructuring executed yet (gated on user review).

- Created `docs/` (did not exist): `project-overview-pdr.md`, `system-architecture.md`, `deck-format-spec.md`, `development-roadmap.md`.
- Created migration plan `plans/260722-0258-ai-deck-kit-restructure/` with `plan.md` + 8 phase files.

## Why
Old model couldn't scale/share/install elsewhere. New vision: one-command install into any project (root or subfolder), AI agent as runtime, deterministic Node/TS CLI core for boilerplate, `.deck` portable bundle format, shared design-primitives layer (blocks + motion/morph + tokens), reuse of existing React preview/export runtime, CI-CD engine releases + in-place upgrade that never touches user decks.

## Locked decisions
Name **AI Deck Kit** (npm `ai-deck-kit`, CLI `aideck` — confirm) · Node+TS CLI · keep custom React runtime · `.deck` folder bundle · foundation-first incremental migration · install root-or-subfolder with root pointer · add design-primitives module · reuse in-content annotation approach.

## Refinements (later same session)
- **Templates = separate `.template` bundles**, engine-side presets (shipped, upgradable in `engine/templates/`); embedded into a `.deck` when used (portability). User-created templates → project `templates/` (upgrade-safe).
- **Install default = project root**; publish via **npx-from-GitHub** (own dedicated engine repo, single package, no npm registry).
- **Git boundary:** engine repo commits `engine/` + `samples/`; gitignores `decks/`, `templates/`, `.build/`. User presentations never pushed. VIVIMOON → `samples/vivimoon-website.deck/` (committed regression fixture; pending user confirm vs `decks/`).
- **Per-module PRDs** added under `docs/modules/` (9 modules + `README.md` index), all following `docs/modules/module-prd-template.md` for consistent future modules.
- Version axes = 4 (template_version, slide_type_catalog, block_catalog, content_schema_version).

## Follow-ups
- All open questions resolved (2026-07-22): CLI `aideck` confirmed; VIVIMOON → gitignored `decks/` (CI generates its own deck); npx-from-GitHub single package; `.build/` inside bundle git-ignored. Specs + plan decision-complete.
- On approval → begin Phase 01 (workspace restructure).
