# Plan revision 2: dual-schema scope (new decks only)

## What changed

User reversed the "no backward compatibility" instruction: the new content
schema applies to **newly created decks only**; the seven existing decks stay
untouched, to avoid rebuilding and repeatedly re-testing them.

Revised `plans/260826-1000-content-md-schema-redesign/`:

- `plan.md` — scope section rewritten around dual-schema dispatch on the
  existing `deck.json` `contentSchemaVersion` field (`1.0.0` = frozen legacy,
  `2.0.0` = canonical). Phase table, non-goals, revision-2 comparison, and
  unresolved questions updated.
- `phase-02b-v1-compatibility-dispatch.md` — **new, blocking.** Restores the v1
  parser verbatim from `12b01d7`, splits v1/v2 into their own modules behind a
  dispatcher, fixes the two landed defects below.
- `phase-06` renamed `migrate-all-decks-and-validate` → `v1-freeze-verification`
  and rewritten: no deck migrated, no deck retemplated; proves nothing changed.
- Phases 01/02/03/04/05 got scoped amendment notes (01 docs follow-up, 02
  defect handoff, 03 validator dispatch, 04 no-change note, 05 retemplate
  guard + manifest bump).

## Why

Verified against real deck content: the landed phase-02 parser already breaks
all seven decks — `body:` (60 uses), header-carried titles (vivimoon has zero
YAML `title:`), `### On-Slide Text` bullet/table derivations, flat `icons[]`
(64 + 12). "Leave the old decks alone" therefore requires restoring the deleted
v1 path, not merely declining to migrate.

## Two landed defects found

- `engine/cli/lib/deck.ts:53` — `createDeck` stamps `contentSchemaVersion:
  "1.0.0"` while `slideContent` emits the v2 skeleton, so new decks are
  mislabelled. No such deck exists yet (all seven verified genuine v1).
- `engine/cli/commands/verify.ts:120` — compares deck schema version for
  **equality** against `engine.version.json`; once the engine advertises
  `2.0.0`, every v1 deck hard-fails `aideck validate`. Needs a supported-set
  membership check.

Both assigned to phase-02b.

## Key decision

v1 is restored **byte-identical**, not re-implemented as an adapter that
normalizes old content into the new prop shape. An adapter is less code but
changes v1 rendering — which is exactly the re-testing burden this revision
exists to avoid. Shared helpers are deliberately duplicated across the two
modules for the same reason.

## Revision 2b — release-boundary cutover (same session)

User clarified the boundary: everything created before the new published
`aideck` version is v1; everything after is v2, and templates move in that same
release.

Two changes fell out:

- **`createDeck` stamps the template's declared `contentSchemaVersion`, not a
  hardcoded `"2.0.0"`.** Templates already carry the field. A v1 template then
  produces working v1 decks, a v2 template produces v2 decks — no flag, no
  guard, no sequencing rule. This resolves the downstream `clarity-courseware`
  follow-up outright: that project can upgrade the engine and keep making
  correct v1 decks until its owner migrates the template.
- **Dispatch on the major version, not the exact string.** Verified drift
  already exists: `linear-dark` declares `1.1.0`, `swiss-modern` and
  `clarity-courseware` declare `1.0.0`, and `vivimoon-website.deck` declares
  `1.0.0` against the `1.1.0` template. Minor already means "same schema, extra
  optional fields". Exact-match dispatch would have mis-routed `linear-dark`
  decks on day one — and is the same latent bug as `verify.ts:120`.

Added `phase-07-release-cutover.md` (engine `0.3.3` → `0.4.0`, upgrade note,
docs), previously unowned. Phase-05 now also bumps both shipped template
manifests to `2.0.0` and the `createTemplate` scaffold default — that bump is
what actually switches new decks to v2.

## Follow-ups

- Downstream `clarity-courseware` migration is now optional, owner-initiated,
  no deadline — its decks keep working as v1 indefinitely.
- No code changed in this session — plan documents only.

## Consistency re-check (same session, post revision 2b)

User asked for an honest verification that the dual-schema model is fully
documented. Re-read `plan.md` + all 8 phase files. Two stale spots found where
revision 2b had not propagated — both fixed:

1. `plan.md` phase table, row 2 — still said `createDeck` "must now stamp
   `contentSchemaVersion: "2.0.0"`", contradicting revision 2b's
   template-derived stamping (which phase-02b's body already had right).
2. `phase-03-validator-updates.md` amendment note — enumerated the dispatch as
   exact strings `"1.0.0"` / `"2.0.0"` with "anything else → fail loudly". Same
   day-one bug as `verify.ts:120`: `linear-dark` decks declaring `1.1.0` would
   have hit the unsupported arm. Rewritten to branch on major only, matching
   phase-02b.

Everything else verified consistent: cutover model, template-derived stamping,
major-version dispatch, breakage evidence, v1-freeze non-goals, and the
resolved `clarity-courseware` question all appear in `plan.md`; phase-02b
carries the dispatch and both landed defects; phase-05 carries the template
bump + retemplate refusal; phase-06 is verification-only; phase-07 is the
release boundary.

## Full sweep (same session) — 5 further stale spots

The first re-check only covered `plan.md`, 01, 02b, 03. Swept the remaining
phase files; revision 2b/2 had not propagated to phases 04, 05, 06 or the
validation log. All fixed:

3. `phase-04` Next Steps — claimed "phase-05 deck migration exercises this
   mechanism on at least one real slide" and that "phase-06 runs that re-sync
   for all 6 real decks before migrating their content". Both describe
   revision-1 behavior that revision 2 forbids. Replaced with the honest
   position: no existing deck exercises overrides (they are v2-only and no deck
   is migrated), so verification is gallery + hand-authored v2 fixture.
4. `phase-04` Success Criteria — concept-diagram criterion was "verified during
   phase-05 migration"; no such migration exists. Now names the fixture.
5. `phase-05` Next Steps — said `vivimoon-website.deck` renders stale "until
   phase-06 explicitly runs `aideck deck retemplate vivimoon-website`". Phase-06
   now verifies that exact command is *refused*. Rewritten: the divergence is
   permanent and the "template is behind" note is the intended steady state.
6. `plan.md` Validation Log — records Validation Session 1, which ran against
   revision 1. Left intact as history (stateful record) but prefixed with a
   marker naming what revision 2 superseded (phase-06 retemplate resolution +
   Interview answer 1) and what survives (the snapshot-resolution finding).
7. `phase-06` Next Steps — pointed at "unresolved question 1" as an open item;
   that question is resolved. Now gates phase-07 and states no open items.

Pattern worth noting: every one of these 7 was a *cross-reference* rather than a
primary statement. The revised phase bodies were right; what rotted was other
files describing them. Any future revision of this plan should grep for inbound
references to a changed phase, not just edit the phase.

## Validation Session 2 (/ak:plan validate, Full tier)

Ran the roles Session 1 deferred. Full results in the plan's `## Validation Log`.
Headline: dispatch feasibility **verified** (deck.json already reaches the
parser), 4 gaps closed, 0 failures, 0 unresolved contradictions.

Two consumers the plan had never mentioned — both found by enumerating every
`contentSchemaVersion` reader in `engine/` rather than trusting the plan's list:
`migrate-slides-to-deck.mjs` (a second deck-creating path; resolved as
keep-at-1.0.0 with a comment) and the template-authoring skill references (which
would have kept steering new templates onto v1 after the release).

Also found a second render path — decks with `.build/source/*.tsx` bypass the
parser entirely, so no dispatch runs for them. None of the seven decks take it
today, but `vivimoon-website.deck` holds a `.tsx.disabled` file that is one
rename away from voiding phase-06's canary.

## Pass 3 — actionable-section sweep (same session)

Prior passes fixed prose and cross-references; the sections an implementer runs
(Implementation Steps / Todo List / Success Criteria) had never been touched.
7 defects fixed — most dangerous: phase-03's steps still instructed deleting v1
validation outright, and phase-04 still edited the downstream v1 template to
consume v2 objects. Full list in `plan.md` → Validation Log → "Validation
Session 2, pass 3".

Follow-up: no plan revision is complete until it has edited the actionable
sections, not just the amendment notes.
