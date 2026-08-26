# Phase 03 Landed: Dual-Schema Validator Dispatch

## What changed

`engine/skills/presentation-crafting/scripts/validate-slide-content.mjs` now
dispatches on the major of `deck.json`'s `contentSchemaVersion`, mirroring the
parser dispatch from phase-02b (`manifest-deck-source.tsx`):

- `1.x` (absent reads as `1.0.0`) → the existing rule set, preserved verbatim
  inside a frozen-commented block. The seven v1 decks keep validating exactly
  as before.
- `2.x` → new `validateContentV2()`: YAML-only `title` (no header fallback),
  `items[]` entries need non-empty `title` and `column` ∈ left/right,
  `override.reason` required when `css`/`html` set, `</style>`/`<script`
  containment guards, recursive `items[].icon` Phosphor check, recursive morph
  anchor walk mirroring the v2 parser, no On-Slide Text/Visual Direction
  requirements.
- Any other major → loud failure naming deck, value, supported majors.

Deliberate duplication between blocks (helpers `v2*`-prefixed) per the plan's
freeze discipline — unifying would let future v2 tightenings silently break v1.

Also reworded the stale validator paragraph in `docs/deck-format-spec.md` §6
(the "old-format gate" note flagged by phase-03's amendment).

## Why

Phase 3 of `plans/260826-1000-content-md-schema-redesign/plan.md`. Under
revision 2's dual-schema scope the validator must judge each deck by its own
schema generation without migrating anything.

## Verification

- Regression gate: all 7 v1 decks (6 clarity + vivimoon) byte-identical
  before/after output diff.
- Canonical v2 example (phase-01 fixture) passes clean; negative fixtures all
  fail with specific messages; `9.9.9` fails loudly; `1.1.0` routes to v1.
- Engine typecheck clean; 35/35 serve tests pass (incl. tests that grep this
  script's source — candidates block preserved verbatim).
- Callers checked: `verify.ts:186`, `presentation.ts:119` consume only exit
  code/output — contract unchanged.

## Follow-ups

- Next pending phases: 4 (override rendering), 5 (template migrations),
  6 (v1 freeze verification), 7 (release cutover); plus phase-01's docs
  follow-up steps 7–9.
