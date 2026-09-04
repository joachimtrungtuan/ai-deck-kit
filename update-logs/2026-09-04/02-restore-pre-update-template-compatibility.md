# Restore compatibility for templates authored before the motion unification

## What changed

Templates written against the previous engine stopped loading entirely after `aideck upgrade`.
`supportedAnimations` and the `--deck-motion-*` tokens had become unconditional hard requirements
inside `validateTemplateBundle`, which `resolveTemplate` throws on — so `slide add`, `deck new`,
`deck retemplate`, `serve <template>` and `doctor` all failed on a bundle the upgrade had just
promised was untouched.

Split the strictness by audience: **the authoring validator stays strict, the runtime loader became
tolerant.**

- `engine/cli/lib/templates.ts`
  - New exported `elementAnimationCatalogV1` (the ten `primitive-anim-*` animations the engine
    implements). The scaffold now reuses it instead of a second hardcoded copy.
  - `findTemplate` — the single manifest read site both `resolveTemplate` and `listTemplates` go
    through — fills an absent `supportedAnimations` with the full catalog. An absent declaration
    means the author never narrowed the set, and the engine implements all of them. The user's file
    is not rewritten.
  - `supportedAnimations` dropped from the unconditional required-field list; still validated when
    present (must be a non-empty array).
  - `validateMotionTokens` no longer errors on a missing `--deck-motion-base` / `--deck-motion-ease`.
    `primitives.css` reads both through literal fallbacks, so such a bundle animates fine — the old
    error text claimed the opposite. The dangling-var-chain check is untouched and still fatal,
    because that genuinely invalidates the declaration at computed-value time.
- `engine/cli/commands/upgrade.ts`
  - Message no longer says templates "were untouched" (read as "still work"); now says they were
    left as they are, followed by `reportTemplateCompatibility`, which names any project template
    that no longer loads and lists its errors, instead of letting the first failure surface later
    from an unrelated command.
- `engine/cli/tests/serve.test.ts`
  - Two regression tests: a pre-update bundle (no `supportedAnimations`, no motion tokens) validates
    clean, and an absent declaration resolves to the full catalog. Both fail without the fix
    (verified by reverting).
  - The motion-token test's first case realigned — its own comment already conceded the fallbacks
    keep such a template animating. That expectation now lives in the authoring validator.
- `.gitignore` — ignores `tmp-compat-check/`, the scratch copy of an external template used to
  reproduce this against a real production bundle.

## Why

Reviewed as finding F2 (Critical) in
`plans/reports/code-review-260904-0900-backward-compatibility-audit.md`. Reproduced against a real
external template (`clarity-courseware`, `templateVersion` 2.1.5, `contentSchemaVersion` 2.0.0):
rejected before the fix on the missing `supportedAnimations` field, accepted after. End-to-end
`resolveTemplate` → `createDeck` now succeeds against it, pinning the snapshot and preserving its
`contentSchemaVersion: 2.0.0` rather than forcing it forward.

This also resolves F3 — the false motion-token error text — since the same demotion covers both.

## Verification

- `npm test` 97/97 (was 95/95; two added).
- Vacuous-test guard: reverting the manifest change fails the new test.
- `npm run typecheck` clean · `npm run lint` 14 files · `npm run validate` all green.
- `npm run build` regenerated `engine/cli/dist`; `build:check` now only reports the rebuilt output
  as uncommitted, which is expected until this lands in a commit.

## Follow-ups

- F1 (retemplate guard fails open for decks with no `contentSchemaVersion`) is untouched — it traces
  to a recorded user decision and is awaiting the user's choice between keep / revert / hybrid.
- F4 partially addressed: legacy *template* shapes now have coverage; legacy *deck* shapes still do
  not, and will need it once F1 is settled.
- F5 (`templateVersionRange` has no consumer) and F6 (field-absent schema defaults disagree between
  `deck-template-sync.ts` and the three other read sites) remain open.
