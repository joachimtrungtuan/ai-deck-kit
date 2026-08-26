---
title: "Phase 02b: v1 Compatibility & Schema Dispatch"
phase: "02b"
status: "completed"
priority: "blocking"
---

# Phase 02b: v1 Compatibility & Schema Dispatch

## Context Links

- [plan.md](plan.md) — revision 2 (dual-schema scope)
- [phase-02](phase-02-engine-parser-and-cli.md) — the v2 parser this dispatches to
- Baseline commit for v1 behavior: `12b01d7` (last commit before the parser rewrite)
- Landed rewrite: `3b2328d feat(deck): parse canonical content schema`

## Overview

**Priority:** blocking — until this lands, every existing deck is broken on
`main`.

Phase-02 replaced the content parser outright. Under revision 2's dual-schema
scope that path is right for v2 decks and wrong for the seven v1 decks that
must keep working. This phase restores the v1 path and puts a dispatcher in
front of both.

It also fixes two defects that revision 2 exposed in already-landed code
(`createDeck` mislabelling new decks; `verify.ts` version equality check).

## Key Insight 0 — dispatch on the major version only

Verified values in the wild: `linear-dark` template declares
`contentSchemaVersion: "1.1.0"`, `swiss-modern` and `clarity-courseware`
declare `"1.0.0"`, and every deck declares `"1.0.0"` — including
`vivimoon-website.deck`, which was built from the `1.1.0` template. Minor
versions are already being used to mean "same schema, additional optional
fields", and they already disagree between a deck and its own template.

So the dispatch reads the **major** component: `1.x` → v1 parser, `2.x` → v2
parser. An exact-string comparison would mis-route decks immediately, and is
also what makes today's `verify.ts:120` a latent bug.

## Key Insight 1 — the dispatch key already exists

Every `deck.json` in the wild already carries `contentSchemaVersion`, set to
`"1.0.0"` (verified in `decks/vivimoon-website.deck/deck.json` and all six
clarity decks). No new field, no migration, no heuristic content sniffing is
needed to tell the two schemas apart. Absent field reads as `"1.0.0"`.

Content-sniffing (guess from whether `title:` is in YAML, whether `items[]`
holds strings or objects) is explicitly rejected: it is ambiguous for slides
that legitimately have neither, and a wrong guess silently renders a deck
wrong rather than failing loudly.

## Key Insight 2 — v1 must be restored byte-identical, not re-implemented

The purpose of this revision is to make re-testing the old decks unnecessary.
That property only holds if the v1 code path is the *same code*, recovered
from `12b01d7`, rather than a fresh adapter that maps old content onto the new
prop shape. An adapter is less code and more elegant; it also changes rendering
behavior in ways nobody has budget to re-verify across seven decks. Restore
verbatim.

Consequence to accept openly: two parsers coexist, and the v1 one is dead-end
code that nobody may tidy, lint-fix, or refactor. It is marked as frozen in a
file-level comment so the next reader does not "improve" it.

## Key Insight 3 — the v2 parser must not regress while being moved

Phase-02's parser was reviewed and tested when it landed. Moving it into its
own module is a file move plus an export rename, nothing else. Any behavioral
edit to it in this phase is out of scope and should be a separate change.

## Requirements

**Functional**

1. A deck declaring `contentSchemaVersion: "1.0.0"` (or omitting it) parses
   through the restored v1 parser and produces byte-identical props to
   `12b01d7`.
2. A deck declaring `"2.0.0"` parses through the phase-02 parser.
3. An unrecognised version fails loudly with a message naming the deck, the
   value found, and the versions the engine supports — never a silent fallback
   to either parser.
4. `aideck deck new` stamps the **template's own** declared
   `contentSchemaVersion`, not a hardcoded constant. A deck's schema is
   inherited from the template that produced it, so a v1 template keeps
   producing working v1 decks and a v2 template produces v2 decks with no flag
   or sequencing rule. This is what lets the downstream `clarity-courseware`
   project upgrade the engine without breaking.
5. `aideck validate` accepts both versions.

**Non-functional**

6. No edit to the seven v1 decks' `content.md` or `deck.json`.
7. The v1 module carries a comment stating it is frozen and why.

## Architecture

`engine/preview-app/src/manifest-deck-source.tsx` becomes a thin dispatcher:

```
manifest-deck-source.tsx        dispatcher: reads manifest.contentSchemaVersion,
                                delegates, throws on unknown
content-schema-v1.tsx           restored verbatim from 12b01d7 — FROZEN
content-schema-v2.tsx           the phase-02 parser, moved unchanged
```

Shared helpers (`textMeta`, `arrayMeta`, `numberMeta`) exist in both versions
today. Do **not** hoist them into a shared module: a later "improvement" to a
shared helper would silently change v1 rendering, which is exactly the failure
this phase is built to prevent. Duplication here is deliberate and load-bearing;
note it in both files.

`Manifest` type in the preview app gains `contentSchemaVersion?: string`.

## Related Code Files

**Modify**

- `engine/preview-app/src/manifest-deck-source.tsx` — becomes dispatcher
- `engine/preview-app/src/preview-types.ts` — `Manifest.contentSchemaVersion`
- `engine/cli/lib/deck.ts:53` — `createDeck` stamps `template.manifest.contentSchemaVersion`
- `engine/cli/commands/verify.ts:120` — equality → membership check
- `engine/engine.version.json` — add `supportedContentSchemaMajors: [1, 2]`

**Create**

- `engine/preview-app/src/content-schema-v1.tsx` — restored, frozen
- `engine/preview-app/src/content-schema-v2.tsx` — moved from phase-02

**Must not change**

- any `.deck` bundle under `decks/` or in `AI Udemy Course/`

## Implementation Steps

1. `git show 12b01d7:engine/preview-app/src/manifest-deck-source.tsx` into
   `content-schema-v1.tsx`. Change only: the exported function name
   (`createManifestDeckSourceV1`) and an added frozen-code header comment. Diff
   it against the original to prove nothing else moved.
2. Move the current (phase-02) parser body into `content-schema-v2.tsx` as
   `createManifestDeckSourceV2`, unchanged.
3. Rewrite `manifest-deck-source.tsx` as the dispatcher. Keep the existing
   exported name and signature so no call site changes.
4. Add `contentSchemaVersion?: string` to the preview `Manifest` type.
5. Fix `createDeck` (`deck.ts:53`) to write
   `template.manifest.contentSchemaVersion`. The template object is already in
   scope there (`template.manifest.templateVersion` is read on the line above),
   so this is a one-line change with no new plumbing.
6. Add `supportedContentSchemaMajors` to `engine.version.json`; leave the
   existing `contentSchemaVersion` field alone if other code reads it, and
   change `verify.ts:120` from an equality test to a supported-major membership
   test.
7. Add a comment at `skills/presentation-crafting/scripts/migrate-slides-to-deck.mjs:126`
   recording that its hardcoded `contentSchemaVersion: "1.0.0"` is **correct and
   deliberate**: that script migrates legacy slide folders, whose content is v1
   by construction. Without the comment the next reader "fixes" it to v2 and
   silently breaks every migrated deck.
8. Rebuild the committed CLI dist.

## Todo List

- [x] `content-schema-v1.tsx` restored verbatim + frozen comment
- [x] `content-schema-v2.tsx` extracted unchanged
- [x] `manifest-deck-source.tsx` dispatches; unknown version throws
- [x] `Manifest.contentSchemaVersion` typed
- [x] `createDeck` stamps the template's declared version
- [x] `engine.version.json` + `verify.ts` accept both majors
- [x] `migrate-slides-to-deck.mjs` v1 stamping annotated as deliberate
- [x] CLI dist rebuilt
- [x] Regression evidence captured (see Success Criteria)

## Verification findings (Validation Session 2, 2026-08-26)

**Dispatch is feasible as designed — VERIFIED.**
`engine/preview-app/vite-deck-plugin.ts:147` builds `resolvedManifest` by
spreading the whole parsed `deck.json` (`{ ...manifest, defaults: {...} }`) and
passes it as the first argument to `createManifestDeckSource` (line 156). So
`contentSchemaVersion` already reaches the parser at runtime; adding it to the
`Manifest` type and branching on it needs no plugin change. This was this
phase's single load-bearing assumption.

**The dispatcher must keep the filename `manifest-deck-source.tsx`.** The plugin
imports it by absolute path built from `process.cwd()` (line 154), not by module
resolution. Splitting v1/v2 into sibling modules is safe; renaming or moving the
entry file breaks preview generation.

**A second deck-creating path exists and is NOT `createDeck`.**
`engine/skills/presentation-crafting/scripts/migrate-slides-to-deck.mjs:126`
also stamps `contentSchemaVersion: "1.0.0"`. It must **stay** `1.0.0` and gets a
comment saying why: that script converts legacy `slides/` layouts and emits
v1-shaped content, so stamping v2 would route v1 content to the v2 parser and
produce a broken deck. Template-derived stamping applies to `createDeck` only.

**Decks with a generated source bypass the parser entirely.**
`loadDeckSource` (lines 135-142) prefers `<deck>/.build/source/*.tsx` and
returns without ever calling `createManifestDeckSource`, so no dispatch runs for
such a deck. Verified across all seven decks: none currently take this path.
`decks/vivimoon-website.deck` has `.build/source/vivimoon-website-deck.tsx.disabled`,
which `generatedSource` (line 407) skips because it requires a `.tsx` suffix —
one rename would silently route the canary around the parser. See phase-06.

## Success Criteria

1. `git diff 12b01d7:engine/preview-app/src/manifest-deck-source.tsx` against
   `content-schema-v1.tsx` shows only the rename and the header comment.
2. `aideck validate` green with `decks/vivimoon-website.deck` still at
   `contentSchemaVersion: "1.0.0"` and its `content.md` unmodified
   (`git status` clean for that bundle).
3. `vivimoon-website.deck` renders in preview with titles present (it has no
   YAML `title:` keys — under the v2 parser every slide would read
   "Untitled", which is the fastest visible proof the dispatch works).
4. A scratch deck created from a v1 template reports that template's version
   and parses through v1; one created from a v2 template reports `"2.0.0"` and
   parses through v2. Both checks matter — the first is the one that keeps the
   downstream course project working.
5. A deck declaring `"1.1.0"` routes to v1 (major-version dispatch), not to a
   "no exact match" failure. `vivimoon-website.deck` against the `1.1.0`
   `linear-dark` template is the live case.
6. A deck with `contentSchemaVersion: "9.9.9"` fails with a message naming
   deck, value, and supported majors.
7. `migrate-slides-to-deck.mjs` still stamps `1.0.0` and carries the comment
   explaining that its output is v1-shaped by construction.
8. `npm --prefix engine run typecheck`, `test:lifecycle`, `test:boundary`,
   `test:serve`, `build`, `lint` all pass.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| v1 restoration subtly altered during the move | Step 1's diff check is the gate; treat any diff beyond rename + comment as a failure |
| Someone later refactors the frozen v1 module | File-level frozen comment + the duplication note; not enforceable by tooling, accepted |
| Decks created between `3b2328d` and this fix are stamped `1.0.0` with v2 content | Check for any such deck before landing; there should be none, but a mislabelled deck would dispatch to v1 and render wrong |
| `engine.version.json`'s existing `contentSchemaVersion` read elsewhere | Grep before changing; adding a new field rather than repurposing the old one keeps blast radius small |
| Minor-version drift widens later (a `1.2.0` template) | Major-only dispatch absorbs it by design; that is the reason for the rule |

## Security Considerations

None. No new input surface — both parsers already run on repo-local content.

## Next Steps

Unblocks phase-03 (validator dispatch mirrors this parser dispatch) and
phase-06 (which verifies the v1 freeze this phase creates).
