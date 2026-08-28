# AI Deck Kit — Development Roadmap

**Status:** Phase 08 implementation plus the 1.0.0 dual-schema cutover prepared (2026-08-28); local QA passed, while remote release and registry-backed clean-install verification remain pending. Continuous-development / CI-CD project — this roadmap remains a living document.
Companion specs: `project-overview-pdr.md`, `system-architecture.md`, `deck-format-spec.md`.
Migration plan: `plans/260722-0258-ai-deck-kit-restructure/plan.md`.

## Delivery Model

Continuous integration + continuous delivery of the **engine**. Each milestone ships a tagged engine version; installed copies upgrade via `aideck upgrade` with `decks/` untouched. Restructure proceeds **foundation-first, incremental** so the workspace stays usable throughout.

## Milestones

| # | Milestone | Outcome | Plan phase |
|---|---|---|---|
| M1 | Two-root workspace | `engine/` + `decks/` split, root pointer, workspace resolution, project config | Phase 01 |
| M2 | `.deck` format live | Bundle format + validators; VIVIMOON migrated to `.deck` | Phase 02 |
| M3 | Design primitives | Block library (`block-catalog v1`), motion vocabulary, isolated morph prototype, base tokens, Storybook component catalog | Phase 03 |
| M4 | CLI core | `aideck` Node/TS: init/new/slide/template/gen/export/serve/pack/doctor/upgrade | Phase 04 |
| M5 | Skills + generation | Skill bundles reworked to `.deck`+CLI; outline-first generation; annotation reuse | Phase 05 |
| M6 | Preview + export + morph | Runtime renders `.deck`; HTML/PDF export; full deck-navigator morph integration; `pack` sharing | Phase 06 |
| M7 | Distribution + CI/CD | GitHub-source `npx` init (root or subfolder), configured release pipeline, upgrade path | Phase 07 |
| M8 | Migration + QA | swiss-modern & linear-dark migrated; end-to-end validation; docs finalized | Phase 08 |

## Post-v1 Backlog (deferred)

- PPTX export (via runtime → pptx bridge or pandoc/marp reference path).
- Local WYSIWYG web editor (optional module; architecture already leaves room).
- Audience-interactive on-slide elements (polls, hotspots).
- Cloud share/hosting for exported decks.
- Template marketplace / shareable template sets.

## Maintenance Cadence

- Update this roadmap + `project-changelog.md` at each milestone completion.
- Update `docs/` whenever module boundaries, the `.deck` schema, or CLI surface change.
- Every engine release runs the CI gate (lint, typecheck, validators, export smoke test).
