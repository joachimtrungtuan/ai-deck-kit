# Phase 6 — Content Schema Version Unification (`contentSchemaVersion` → 3.0.0)

**Plan:** `plans/260901-1104-motion-unification-showcase-deck-and-diagram-ir/phase-06-content-schema-version-unification.md`

## What changed

One declared `contentSchemaVersion` across the engine, both shipped templates,
the showcase deck, and its embedded snapshot — set to **`3.0.0`** (major bump
from `2.0.0`, the value both templates already declared). The dual-major engine
is preserved: `supportedContentSchemaMajors` widened to `[1, 2, 3]`, the v1
parser/validator kept frozen, v2 and v3 share one grammar.

### Changed files

| File | Change |
|---|---|
| `engine/engine.version.json` | `contentSchemaVersion` 1.0.0 → 3.0.0; majors `[1,2]` → `[1,2,3]` |
| `engine/templates/swiss-modern.template/template-manifest.json` | 2.0.0 → 3.0.0 |
| `engine/templates/linear-dark.template/template-manifest.json` | 2.0.0 → 3.0.0 |
| `engine/examples/showcase.deck/deck.json` | 2.0.0 → 3.0.0 |
| `engine/examples/showcase.deck/template/template-manifest.json` | embedded snapshot 2.0.0 → 3.0.0 (pin stays linear-dark 3.2.0; full re-sync deliberately separate) |
| `engine/cli/lib/templates.ts` (scaffold seed) | 2.0.0 → 3.0.0 |
| `engine/cli/lib/deck.ts` | `slideContent` default 2.0.0 → 3.0.0; dispatch gains major 3 → canonical grammar; error message lists 1, 2, 3 |
| `engine/cli/lib/deck-template-sync.ts` | field-absent fallbacks 1.0.0 → 3.0.0 (user decision, see below) |
| `engine/preview-app/src/manifest-deck-source.tsx` | supported majors `[1,2]` → `[1,2,3]`; field-absent default stays 1.0.0 (fieldless deck content is v1-shaped) |
| `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs` | supported majors widened to `[1,2,3]`; major ≠ 1 falls to the v2 rule set |
| `engine/cli/dist/**` | regenerated via `npm run build` (never hand-edited) |
| `docs/deck-format-spec.md` | canonical version 3.0.0, example manifest, validation dispatch wording, new §10 Content Schema History with changelog + consumer migration note |
| `docs/codebase-summary.md` | refreshed schema version + majors + current templateVersion (3.3.0) |
| `engine/skills/presentation-template-creation/references/template-system-and-versioning.md` | example manifest 2.0.0 → 3.0.0 |

## Why major

Aggregate breaking changes of plan phases 1–5: merged element-animation
catalog (template-local vocabularies removed), slide-level `animation` now
validated, required `supportedAnimations` template manifest field, slide-type
catalog default v2, `assets/diagrams/` recognised. Written down in
`docs/deck-format-spec.md` §10.

## Decision record (deviation from plan text)

- The plan listed `deck-template-sync.ts:105-106` fallbacks for modification;
  the agent flagged that these encode "field absent ⇒ legacy" semantics.
  **User chose: change to `3.0.0` anyway.** Consequence: a manifest missing
  `contentSchemaVersion` is now treated as current-major for the retemplate
  same-major guard. The validator and preview-app keep their field-absent
  default at `1.0.0`, so parsing of fieldless decks is unchanged.
- Touchpoint the plan missed: `validate-slide-content.mjs` (mirrors
  `manifest-deck-source.tsx` by its own comment) and the showcase deck's
  embedded snapshot manifest — both updated, both validated green.

## Verification

- CLI build (`tsc` cli project): clean; dist regenerated.
- Engine typecheck: clean.
- CLI test suite: **95/95 pass** (old-major fixtures still green → dual-major preserved).
- `validate-slide-content.mjs` on `engine/examples/showcase.deck`: **valid**.
- `validate-template-manifest.mjs` on both shipped manifests: **valid**.
- Grep: no `contentSchemaVersion: "2.0.0"` declarations remain in `engine/` or
  `docs/` outside test fixtures; every declaration is `3.0.0`.

## Follow-ups

- Showcase deck remains pinned to linear-dark 3.2.0 while shipped templates are
  3.3.0; `aideck deck retemplate` to re-pin is a deliberate separate step
  (carried from Phase 5 log).
- Plan success criterion "One contentSchemaVersion value…" is now met; the
  plan's Validation Log may be updated by a later docs pass.
