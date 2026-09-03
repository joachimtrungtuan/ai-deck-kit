# Phase 5.1 — Promotion Tripwire Repair (template half)

## What changed

Executed plan phase 5.1 (`plans/260901-1104-motion-unification-showcase-deck-and-diagram-ir/phase-05.1-promotion-tripwire-repair.md`), repairing the four defects the Phase 5 code review (`plans/reports/code-review-260903-1554-phase5-promotion-tripwire.md`) found in commit `6a0eb8b`:

1. **F1 (critical):** `engine/templates/linear-dark.template/layouts/react/technical-slides.tsx` — `data-flow` `to` span fontSize raised from `calc(var(--ld-type) * 13px)` to `calc(var(--ld-type) * clamp(15px, 1.15vw, 20px))`, matching the `from` span (Phase 5 raised only one of the two primary spans).
2. **F2 (high):** `engine/templates/template-system.md` — linear-dark row `3.2.0` → `3.3.0` (matches its manifest; swiss-modern row already correct).
3. **F4 (medium):** `engine/templates/linear-dark.template/design-system.css` — duplicated `.ld-panel .ld-list-compact-tall-text li` rule comma-joined into the base rule (values now in exactly one place); CSS comment and the phase-05 execution record corrected from the wrong `(0,4,1)` specificity claim to `(0,2,1)`-tied, wins-by-source-order wording.
4. **F3 + F5 (verification):** rendered the live 3.3.0 template via `aideck serve template linear-dark` and measured computed styles in the browser — before-after panel items receive the tall-text scale (21.08px, cascade holds after the join); data-flow from/to render equal (15.64px) with the secondary label smaller (13.6px) and no overflow at max slide width; all 11 list-bearing slides swept with zero clipping. Phase-05's vacuous showcase criterion rewritten to state what was actually verified.

## Why

Phase 5's template half shipped a half-applied fix, reintroduced doc drift, duplicated a cascade-fragile CSS rule, and verified a visual change with no visual evidence. Phase 5.1 closes those defects without revisiting the user's type-scale decision.

## Gates

`npm test` 95/95 · lint · typecheck · validate — all green. `git grep "3\.2\.0"` clean outside `engine/examples`/`plans`/`update-logs`.

## Follow-ups / open user decisions

- Whether `engine/examples/showcase.deck` re-syncs from its deliberate 3.2.0 freeze to 3.3.0 (raised, not acted on — user's call). A frozen fixture structurally cannot verify template changes.
- Possible follow-up idea (out of scope here): generate the `template-system.md` version table from the manifests to stop the recurring drift.

## Status

Phase 5.1 marked Complete in `plan.md`; Phase 6 (content schema version unification) is next.
