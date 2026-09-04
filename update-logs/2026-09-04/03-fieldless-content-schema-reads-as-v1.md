# Fieldless `contentSchemaVersion` reads as v1, and gets stamped

## What changed

- `engine/cli/lib/deck-template-sync.ts` — the two `?? "3.0.0"` fallbacks in
  `retemplateDeck` become one named constant `LEGACY_CONTENT_SCHEMA_VERSION = "1.0.0"`.
  On the paths re-sync allows, the resolved version is now written back into
  `deck.json`, so a fieldless deck stops being ambiguous after its first re-sync.
- `docs/deck-format-spec.md` — states the absent-field rule and the stamping
  behavior explicitly. The migration skill referenced a "documented absent-version
  legacy default" that was implied by the spec but never spelled out.
- `engine/cli/tests/deck-lifecycle.test.ts` — two regression tests plus a
  `stripContentSchemaVersion` helper that reproduces a pre-field deck bundle.
- `plans/reports/code-review-260904-0900-backward-compatibility-audit.md` —
  F1 and F6 marked fixed; decision record records the revision.

## Why

F1: a deck manifest without `contentSchemaVersion` was read as `3.0.0` by the
retemplate same-major guard and as `1.0.0` by everything else (verifier, preview
runtime, content validator). A pre-field deck could therefore be re-synced onto a
v3 template and then fed v1-shaped props to v3 components — silent mis-render, no
error. F6 was the same divergence stated as a consistency defect.

`1.0.0` is safe by construction, not by convention: `git log -S` puts the v1/v2
dispatch (`canonicalSlideContent`, `legacySlideContent`) and the first write of
`contentSchemaVersion` both no later than `e4f7520`, so a fieldless deck cannot
contain v2 grammar. It is also the loud guess — if a bundle from outside the
toolkit ever violates the assumption, the major-mismatch guard refuses with an
explanation instead of re-rendering it wrong.

Stamping closes the ambiguity permanently rather than re-deriving it on every
read. Deliberately narrow: only operations that already rewrite `deck.json` stamp,
so nothing writes to a deck as a side effect of merely inspecting it.

## Verification

- `npm test` — 99/99 (was 97).
- Vacuous-test guard: reverting the constant to `3.0.0` and deleting the stamp
  makes exactly the two new tests fail (12/14 in `deck-lifecycle.test.ts`); fix
  restored, back to green.
- `npm run typecheck`, `npm run lint` (14 files), `npm run build`,
  `npm run validate` — all clean.

## Follow-ups

- F4 — legacy *deck* shapes now have coverage for the fieldless case; other
  pre-update deck shapes still have none.
- F5 — `templateVersionRange` in `engine.version.json:7` still has no read site.
- Division of labour question left open by the user's proposal: the CLI now
  refuses deterministically, and the `content-schema-migration` skill owns the
  judgment of what a non-conforming bundle actually is. The skill has not been
  extended to cover bundles that are neither v1 nor a recorded schema.
