---
title: "content.md Schema Redesign"
---

# content.md Schema Redesign

**Status:** Phases 1–5 and 2b implementation complete (2026-08-26). Scope
revised 2026-08-26 (revision 2, see below): dual-schema instead of hard
cutover. Phase 1 docs follow-up and Phases 6–7 remain pending.

## Origin

User hit real inconsistency in a downstream project (5 `.deck`s under
`AI Udemy Course/courses/claude-for-marketers/slides/decks/`): slide title
sometimes in the Markdown header, sometimes in YAML; card/list data
duplicated or dropped depending on slide; a flat `icons[]` positionally
matched to items; no deterministic mapping from content.md to layout. Full
per-type breakdown and decision trail: chat transcript 2026-08-25/26 (this
plan file is the durable record; do not re-derive from transcript).

The 5 target decks use a **project-local template**, `clarity-courseware`
(`slideTypeCatalog: "clarity-courseware-v1"`), not this engine's shipped
`linear-dark`/`swiss-modern` sets. All schema decisions were verified against
that template's real React components, not guessed.

**Scope decision (2026-08-26, revision 2 — supersedes the original
"no backward compatibility" instruction): the new schema applies to newly
created decks only.** Every deck that exists today keeps its current
`content.md` untouched and keeps rendering exactly as it does now. The
motivation is risk, not effort alone: migrating six real decks means
re-reviewing and re-testing every slide in all of them, repeatedly, for a
change that buys those decks nothing.

This makes the engine **dual-schema**, dispatched on a field that already
exists in every `deck.json`: `contentSchemaVersion`.

- `"1.0.0"` (**v1, legacy, frozen**) — every deck that exists today. Parser,
  validator, and each deck's frozen `template/` snapshot continue to behave
  exactly as they do at commit `12b01d7` (the last commit before this plan's
  parser rewrite). v1 is not extended, not improved, and not deleted.
- `"2.0.0"` (**v2, canonical**) — stamped on decks created from a v2 template,
  starting with the release described under "Cutover model" below. This is the
  schema in the "Locked schema decisions" below.

Absent field is read as `1.0.0`. All seven existing decks carry the field
explicitly, so that default is defensive rather than load-bearing.

**Cutover model (2026-08-26, user instruction).** The boundary is an **engine
release**, not a per-deck choice and not a date. Everything created before the
new `aideck` version is published stays v1. Everything created after it is v2,
and the shipped templates move to v2 in that same release. There is no window
in which a project is half-migrated by accident, because a project only crosses
the line when it upgrades the engine.

Two consequences fall out of that, both of which simplify the plan:

1. **A deck's schema is inherited from the template it was created from, not
   hardcoded in the CLI.** Templates already declare `contentSchemaVersion` in
   their manifest, so `createDeck` should stamp the template's value rather than
   a constant. A template still on v1 then produces working v1 decks, and a
   v2-migrated template produces v2 decks — automatically, with no flag, no
   guard, and no sequencing rule for anyone to remember. This supersedes the
   earlier "stamp `2.0.0`" instruction.
2. **This resolves the downstream `clarity-courseware` question entirely.** That
   template lives in `AI Udemy Course/` and is not touched by an engine upgrade.
   Under template-derived stamping, the course project can upgrade the engine
   and keep making working v1 decks until its owner chooses to migrate that
   template. Nothing breaks in the gap.

**Dispatch is on the major version, not the exact string.** Verified: shipped
templates already disagree on minor — `linear-dark` declares `1.1.0`,
`swiss-modern` and `clarity-courseware` declare `1.0.0`, and
`vivimoon-website.deck` declares `1.0.0` against a `1.1.0` template. Minor is
already in use to mean "same schema, extra optional fields". So `1.x` → v1
parser, `2.x` → v2 parser; an exact-match dispatch would have mis-routed
`linear-dark` decks on day one.

**Decks affected — all stay v1, all stay untouched:**

- `AI Udemy Course/courses/claude-for-marketers/slides/decks/{claude-lesson-1-1,
  claude-lesson-1-5, claude-lesson-2-2, claude-lesson-2-3, claude-lesson-2-4,
  claude-lesson-2-5}.deck` (`clarity-courseware`) — six, not the five
  originally listed; `claude-lesson-1-1.deck` was missed in the first pass.
- `decks/vivimoon-website.deck` (this repo, `linear-dark`).

**Why this is now urgent rather than optional.** The landed phase-02 parser is
new-schema-only and *already* breaks all seven decks, verified by inspecting
their real content:

| Removed by phase-02 | v1 decks relying on it |
|---|---|
| `body:` YAML key (renamed to `description:`) | 60 occurrences across the clarity decks |
| Header-carried title (`## Slide 01: Text`) | `vivimoon-website.deck` — has zero `title:` keys |
| `### On-Slide Text` bullets → `items`/`leftItems`/`rightItems` | all clarity list slides; only 1 deck-side `items:` key exists in YAML |
| flat `icons[]` | 64 clarity + 12 vivimoon occurrences |
| `### On-Slide Text` tables → `tableColumns`/`tableRows` | 10 clarity occurrences (YAML-side keys also present) |

So "keep the old decks as they are" is not a no-op — it requires restoring the
v1 parse path that phase-02 deleted. That is the new [phase-02b](phase-02b-v1-compatibility-dispatch.md).

**Restoration method, chosen to make re-testing unnecessary:** the v1 parser is
restored *verbatim* from commit `12b01d7`, not rewritten as an adapter that
normalizes old content into the new prop shape. An adapter would be less code,
but it would change how v1 decks render, which is precisely the re-check-and-
re-test burden this revision exists to avoid. Byte-identical code is the only
form of "unchanged" that needs no visual regression pass.

**Template consequence.** Each `.deck` renders from its own frozen `template/`
snapshot (verified: `engine/preview-app/vite-deck-plugin.ts` `deckTemplateRoot()`
lines 383–394), so migrating the shared `linear-dark`/`swiss-modern` sources to
v2 in phase-05 does not reach any existing deck. The corollary is a new hard
constraint: **running `aideck deck retemplate` on a v1 deck against a
v2-migrated template would break it**, so that combination must be refused, not
merely noted (phase-05).

## Locked schema decisions

1. Slide header carries no title text: `## Slide 05 (slide-05)`. `title:` in
   YAML is the sole title source, **with no fallback to header text, for every
   template** (clarity-courseware, linear-dark, swiss-modern). For
   `type: quote`, `title:` holds the quote text itself (matches the real
   `ClarityQuoteSlide` — no separate `quote:` key).
2. Card/list data uses one canonical `items: [{title, description?, icon?, column?}]`
   everywhere a layout renders a list of cards, **for every template** —
   replaces `leftListItems`/`rightListItems`/positional `icons[]`/bullet-
   splitting/flat `leftItems`/`rightItems`/`icon`/`icons` wherever any of
   those appear today (clarity-courseware never had them; linear-dark and
   swiss-modern do and get migrated off them in phase-05). `column:
   "left"|"right"` distinguishes sides for two-column layouts — layouts filter
   `items` by `column` themselves rather than the parser pre-splitting into
   separate props. Some layouts only consume `title`+`icon` from each item
   (concept-diagram, closing/next-steps) and silently ignore `description` if
   present — documented per-type, not hidden.
3. `description:` (authoring name) maps to the existing `body` render prop —
   pure rename at the parser boundary, zero template `.tsx` changes.
4. Override mechanism merges into the **existing** `override:` object (do not
   introduce a colliding new `overrides:` key): adds `css` and `html` beside
   the existing `layout`/`animation`/`reason`. `css` is scoped via
   `[data-slide-id="<id>"]` and targets the template's existing stable
   classnames (e.g. `.cc-media-frame-43`) — covers width/spacing changes with
   zero template edits. `html` is appended as an extra absolutely-positioned
   overlay layer on top of the normal render (not a slot-replacement — no
   layout exposes slot markers today). `reason` required whenever any of
   `layout`/`animation`/`css`/`html` is set.
5. `### On-Slide Text` is dropped entirely for all clarity-courseware types.
   No component needs more prose than `title`+`description`+`kicker`/`source`/
   `caption`/`attribution` already cover, including quote/closing.
6. `stats[]`, `images[]`, `chartData[]`, `regionSeries[]`, `tableColumns`/
   `tableRows` stay their own distinct shapes — not folded into `items[]`
   (different data: a stat is value+label, not title+description).
7. *(Revision 2: this decision stands as a v2 schema decision, but the
   downstream `clarity-courseware` template edit that would implement it is
   deferred to that template's own optional migration — see phase-04's
   correction and phase-07's Next Steps.)*
7. `concept-diagram` (data-visual) gains `items[].icon` as an explicit
   override on top of the existing `semanticIconName()` guess — the one real
   template-side (not just parser-side) code change needed for the `items[]`
   unification to hold everywhere.
8. `language` on `code` slides stays in the schema as documentation-only
   metadata (tokenizer doesn't branch on it today; harmless to keep).

Full per-type field tables (all 10 types / 34 variants) are not re-copied
here — see phase-01, which is where they become the actual doc content.

## Phases

| # | Phase | Status | Output |
|---|---|---|---|
| 1 | [Canonical schema & docs](phase-01-canonical-schema-and-docs.md) | done, **needs amendment** | `docs/deck-format-spec.md` documents v2 as canonical **and** v1 as frozen-but-supported |
| 2 | [Engine parser & CLI](phase-02-engine-parser-and-cli.md) | done, **needs amendment** | v2 parse/emit path; `createDeck` must stamp the **template's own declared** `contentSchemaVersion` (revision 2b), not a constant |
| 2b | [v1 compatibility & dispatch](phase-02b-v1-compatibility-dispatch.md) | done | v1 parser restored verbatim; `manifest-deck-source.tsx` dispatches on `contentSchemaVersion`; schema-aware CLI scaffolds; `verify.ts` accepts both |
| 3 | [Validator updates](phase-03-validator-updates.md) | done (2026-08-26) | `validate-slide-content.mjs` dispatches: v1 rules unchanged, v2 rules added |
| 4 | [Override rendering](phase-04-override-rendering-and-template-tweak.md) | done (2026-08-26) | Engine-side CSS/HTML override wrapper only. The concept-diagram `items[].icon` edit moved out — it touches the downstream v1 template |
| 5 | [Migrate linear-dark & swiss-modern templates](phase-05-migrate-linear-dark-and-swiss-modern-templates.md) | done (2026-08-26) | Both templates consume unified `items[]`, bump to `contentSchemaVersion: "2.0.0"`; `deck retemplate` refuses v1-deck-onto-v2-template |
| 6 | [v1 freeze verification](phase-06-v1-freeze-verification.md) | done (2026-08-26) | No deck migrated. Proves all seven v1 decks still parse, validate, and render unchanged |
| 7 | [Release cutover](phase-07-release-cutover.md) | **new** | Engine version bump that is the v1/v2 boundary, plus the upgrade note explaining it |

Dependencies: 2 and 3 depend on 1. **2b depends on 2 and blocks everything
else** — until it lands, every existing deck is broken on `main`. 4 is
independent. 5 depends on 1 + 2. 6 depends on 2b + 3 + 5, and is now a
verification gate rather than a migration. 7 depends on all of them — it is the
publish step that makes the cutover real.

## Non-goals

- **No migration of any existing deck.** The seven v1 decks are not converted,
  not partially converted, and not re-authored. If one is ever wanted on v2,
  that is a separate, per-deck, user-initiated decision.
- **No automated v1→v2 migration tool.** Nothing has asked for one; writing a
  converter for content nobody intends to convert is speculative work.
- **No v1 improvements.** v1 is frozen at its `12b01d7` behavior. Bugs found in
  the v1 path are documented, not fixed, unless they are regressions this plan
  itself introduced.
- No change to the `blocks[]`/`morph` design-primitives mechanism.
- No fix to the pre-existing `final-statement` spec/implementation drift
  (`layout-contracts.md` documents an optional bottom-right image that
  `ClarityClosingSlide` doesn't render) — flagged to user as FYI, out of scope.
- No change to `code`'s tokenizer to make `language` affect highlighting.
- No migration of the downstream `clarity-courseware` template to v2. That
  template lives in `AI Udemy Course/`, not this repo, and an engine upgrade
  does not touch project-local templates. Under template-derived stamping this
  is harmless: that project keeps producing working v1 decks until its owner
  migrates the template, at which point its new decks become v2 on their own.

## Validation Log

> **Read this section as history, not as current instruction.** It records
> Validation Session 1, which ran against **revision 1** (hard cutover, all
> decks migrated). Revision 2 reversed that. Specifically superseded below:
> phase-06's "retemplate all 6 decks before migrating content" resolution and
> Interview answer 1 that confirmed it — under revision 2 no deck is migrated
> or retemplated, and phase-06 verifies that `aideck deck retemplate` on a v1
> deck is *refused*. The underlying **technical finding** (decks render from
> their own frozen `template/` snapshot; `aideck validate` soft-notes staleness)
> remains true and load-bearing — only the response to it changed.

### Verification Results (Validation Session 1, 2026-08-26)

Tier: Full (6 phases → 5+ triggers Full per validate-workflow.md), executed
directly (Bash/grep/find) rather than via 4 spawned subagent roles, per this
repo's Token Discipline rule (no-subagent-by-default; economical direct
verification when it fully answers the question).

**Fact Checker — path/existence claims:**
- `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs` —
  VERIFIED via `find` (phase-03 Context Links corrected from a hedged/unconfirmed
  path to this exact one).
- `AI Udemy Course/courses/claude-for-marketers/slides/decks/{claude-lesson-1-5,
  2-2,2-3,2-4,2-5}.deck` — VERIFIED, all 5 directories exist.
- `AI Udemy Course/.../slides/templates/clarity-courseware.template/layouts/react/data-slides.tsx`
  (shared source phase-04 targets) — VERIFIED, exists.
- `engine/templates/linear-dark.template/layouts/react/shared.tsx` flat-prop
  type defs (`items?: string[]`, `leftItems?/rightItems?: string[]`,
  `icon?/icons?: string[]`) and call sites in `product-workflow-slides.tsx`
  (lines 51, 58), `text-led-slides.tsx` (lines 44, 48) — VERIFIED via grep,
  matches phase-05's claims.
- `engine/templates/swiss-modern.template/layouts/react/shared.tsx` same
  pattern; `product-workflow-slides.tsx` (lines 32, 39), `text-led-slides.tsx`
  (lines 40, 44) — VERIFIED via grep, matches phase-05's claims.

**Contract Verifier — deck rendering resolution (new finding, not previously
documented in any phase):**
- Claim tested: "does editing a shared `engine/templates/*.template` source
  automatically affect how an already-created `.deck` renders?"
- Finding: NO. Each `.deck` bundle carries its own frozen `template/` snapshot.
  `engine/preview-app/vite-deck-plugin.ts`'s `deckTemplateRoot()` (lines
  383–394) prefers the deck's embedded `template/` snapshot over the shared
  source, falling back to the shared source only if the snapshot is missing.
  `aideck deck retemplate <slug>` (`engine/cli/lib/deck-template-sync.ts`'s
  `retemplateDeck`, wired in `engine/cli/commands/deck-maintenance.ts`) is the
  only way to re-sync a deck's snapshot from its current source template.
  `engine/cli/commands/verify.ts`'s `checkDeckTemplate` (lines 130–167) treats
  a stale ("behind") snapshot as a soft `note`, not a hard error — so
  `aideck validate` can report green while a deck's actual rendering code is
  stale relative to landed template edits.
- VERDICT: VERIFIED (file:line cited above). This was a genuine gap: phase-06
  as originally drafted would have migrated `content.md` files against
  possibly-stale embedded template snapshots after phase-04/05 landed their
  component changes only in the shared sources.
- Resolution: propagated as fixes (not raised as a question — this is a
  verified technical fact with one sane resolution, not a business judgment
  call, per this repo's "Verified Decisions"/"Scout First" rules):
  - [phase-06](phase-06-v1-freeze-verification.md): new Key Insights
    bullet, new Requirements bullet, new Implementation Step 1 (retemplate all
    6 decks before touching any `content.md`), renumbered steps 1–6 → 2–7, new
    Todo item.
  - [phase-04](phase-04-override-rendering-and-template-tweak.md): Next Steps
    cross-reference clarifying its manual verification uses the template
    gallery (live shared template), not any deck's frozen snapshot.
  - [phase-05](phase-05-migrate-linear-dark-and-swiss-modern-templates.md):
    Next Steps cross-reference clarifying `vivimoon-website.deck` keeps
    rendering pre-migration component code until phase-06's retemplate step
    runs.

**Not run this session (Full tier normally calls for a Flow Tracer pass on
phase-02's specific parser-rewrite claims and a Scope Auditor completeness
pass):** the one Contract Verifier finding above was material enough to fully
occupy this session's verification budget; phase-02's own parser claims are
lower-risk (single-file, already-conventional `yaml`-package parsing per its
own Next Steps note) and are deferred to implementation-time review rather
than a second dedicated verification pass, per Token Discipline.

Unresolved contradictions: 0 (all edits cross-checked for internal consistency
when applied; the full Whole-Plan Consistency Sweep across all 7 files runs as
Step 7, after the user interview below, in case interview answers introduce
new edits to reconcile).

### Interview (Validation Session 1, 2026-08-26)

1. **Retemplate gap** — verification found shared template edits (phases 4-5)
   don't reach a deck's actual rendering until `aideck deck retemplate <slug>`
   runs; `aideck validate` only soft-notes stale snapshots. Asked how to
   handle it. **Answer: "Manual step in phase-06 only"** — keep the
   already-propagated fix (phase-06's new mandatory Implementation Step 1) as
   the sole response; do **not** additionally harden `checkDeckTemplate` to
   hard-fail on "behind" drift. No `verify.ts` change is in scope for this
   plan. No further edit needed — this confirms phase-06's current text as-is.
2. **Swiss-modern coverage** — no real deck uses `swiss-modern`, so phase-05's
   migration of it is verified only structurally (typecheck + hand-authored
   fixture), not against real content. Asked if that gap is acceptable.
   **Answer: "Structural verification is fine"** — no scratch test deck will
   be created. No further edit needed — this confirms phase-05's current Risk
   Assessment text (already documents this as an accepted, flagged gap) as-is.

Both answers confirmed the plan's existing (already-drafted) approach —
zero propagation edits required from this interview.

### Whole-Plan Consistency Sweep (Validation Session 1, 2026-08-26)

Re-read `plan.md` + all 6 `phase-*.md` files after all edits above.

- phase-06's step renumbering (old 1–6 → new 2–7, with new step 1 inserted) is
  internally consistent: Implementation Steps read 1–7 in order, and the Todo
  List / Success Criteria reference the right steps (re-templating as its own
  checked item, migration/validate/commit/log steps following in the same
  order as the renumbered list).
- Cross-file term consistency checked by grep across phase-01/02:
  `HEADER_RE`, `collectMorphAnchors`, `parseMetadata`, `SlideOverride`,
  `override:` shape, and "Canonical per-slide shape" all resolve to the same
  definitions phase-03/04/06 assume when citing them — no stale or renamed
  terms found.
- phase-04's and phase-05's new "Next Steps" cross-references to phase-06's
  retemplate step name the correct command (`aideck deck retemplate <slug>` /
  `vivimoon-website`) matching phase-06's actual Implementation Step 1 text.
- No contradictions found between the Interview answers above and any phase
  file's existing text — both answers confirmed already-drafted behavior, so
  no phase file required a change as a result of the interview.

**Unresolved contradictions: 0.**

### Validation Session 2 (2026-08-26) — revision 2 verification

Tier: Full (8 phases). Ran the two roles Session 1 deferred (Flow Tracer, Scope
Auditor/Contract Verifier), because revision 2 moved the risk centre onto the
parser dispatch. Executed directly per Token Discipline.

**Flow Tracer — is dispatch even reachable? VERIFIED, feasible as designed.**
`engine/preview-app/vite-deck-plugin.ts:147` spreads the whole parsed
`deck.json` into `resolvedManifest` and passes it to
`createManifestDeckSource` (line 156), so `contentSchemaVersion` already
reaches the parser. Phase-02b's one load-bearing assumption holds. Corollary
recorded in phase-02b: the plugin imports the entry file by a `process.cwd()`
absolute path (line 154), so the dispatcher must keep the filename
`manifest-deck-source.tsx`.

**Flow Tracer — second render path found (not previously documented).**
`loadDeckSource` prefers `<deck>/.build/source/*.tsx` and returns without
calling the parser at all (lines 135-142). Dispatch never runs for such a deck.
Checked all seven: none take this path today.
`decks/vivimoon-website.deck` holds
`.build/source/vivimoon-website-deck.tsx.disabled`, skipped only because
`generatedSource` (line 407) requires a `.tsx` suffix. Propagated to phase-06:
the "Untitled" canary is void if that file is ever re-enabled.

**Contract Verifier — enumerated every `contentSchemaVersion` consumer in
`engine/` (excluding dist/node_modules). Two the plan never mentioned:**
- `engine/skills/presentation-crafting/scripts/migrate-slides-to-deck.mjs:126`
  — a second deck-creating path besides `createDeck`, stamping `1.0.0`.
  Resolution (phase-02b): **keep** `1.0.0` and comment why — it emits v1-shaped
  content by construction, so template-derived stamping must not be applied
  here; stamping v2 would route v1 content to the v2 parser.
- `engine/skills/presentation-template-creation/references/template-system-and-versioning.md:45`
  (`"1.0.0"` manifest example) and `react-layout-conventions.md:31` ("bump the
  minor version when fields are added"). Both steer new hand-authored templates
  onto v1, which under template-derived stamping means new decks keep coming out
  v1 after the release. Propagated to phase-05.

Remaining consumers verified as already-covered or benign: `cli/lib/types.ts:20`
and `templates.ts:19` (type decls), `templates.ts:176` (phase-05),
`deck.ts:53` + `verify.ts:120` (phase-02b), `validate-slide-content.mjs:33` and
`validate-template-manifest.mjs:18` (required-field lists, phase-03), and six
test files pinning `"1.0.0"` (phase-02b success criteria 4-6 add both-major
coverage).

**Failures: 0. Gaps closed: 4. New unresolved contradictions: 0.**

No interview run: every finding resolved to one technically-correct answer with
no business trade-off, per this repo's Scout-First / Verified-Decisions rules.

### Whole-Plan Consistency Sweep (Validation Session 2)

Preceded by an ad-hoc sweep earlier the same session that fixed 7 stale
cross-references (recorded in `update-logs/2026-08-26/03-*.md`). Re-read all 9
files after this session's edits. Checked: stamping model stated identically in
`plan.md` and phases 02/02b/05/07; dispatch described as major-version in
`plan.md`, 02b, and 03; no surviving instruction to migrate or retemplate any
deck; `plan.md`'s Session-1 log carries its superseded-by-revision-2 marker.

**Unresolved contradictions: 0.**

## Post-Validation Status

Plan validated. Ready for `/ak:cook plans/260826-1000-content-md-schema-redesign/plan.md`
once the user confirms they want to begin implementation — per the user's
explicit, standing requirement that implementation only starts once the full
plan is agreed.

## Revision 2 — dual-schema scope (2026-08-26)

**Trigger:** user instruction — apply the new content structure to newly
created decks only; leave already-working decks untouched to avoid rebuilding
and repeatedly re-testing them.

**What changed versus revision 1:**

| | Revision 1 (hard cutover) | Revision 2 (dual-schema) |
|---|---|---|
| Old decks | all migrated to v2 | untouched, frozen at v1 |
| Parser | v2 only | dispatch on `contentSchemaVersion` |
| Validator | v2 rules replace v1 | both rule sets, dispatched |
| Deck count in scope | 6 (miscounted) | 7, all out of migration scope |
| Phase 6 | migrate + validate | prove nothing changed |
| Risk centre | breaking real decks during migration | v1 path drifting silently from its frozen behavior |

**Impact on already-landed phases 1–2:** phase-02's parser rewrite is kept as
the v2 path and is not reverted — it is correct for v2. What it lacks is the
dispatch and the preserved v1 branch, which is why phase-02b exists rather
than a revert. Phase-02's one outright defect under the new scope is that
`createDeck` (`engine/cli/lib/deck.ts:53`) still stamps
`contentSchemaVersion: "1.0.0"` while emitting a v2 `slideContent` skeleton —
so every deck created since that commit is mislabelled v1 while holding v2
content, and would be dispatched to the wrong parser. Fixed in phase-02b.

**Second landed defect found during this revision:**
`engine/cli/commands/verify.ts:120` compares the deck's `contentSchemaVersion`
for **equality** against `engine.version.json`. The moment the engine advertises
`2.0.0`, all seven v1 decks hard-fail `aideck validate`. Must become a
supported-set membership check. Fixed in phase-02b.

## Unresolved questions

1. ~~Downstream `clarity-courseware` template~~ — **resolved by the cutover
   model.** Because `createDeck` stamps the template's own declared
   `contentSchemaVersion` rather than a constant, that project keeps producing
   correct v1 decks after upgrading the engine, and starts producing v2 decks
   only once its owner migrates the template. No decision needed before the
   next course deck is created.
2. ~~`claude-lesson-1-1.deck` inventory gap~~ — **resolved during this
   revision.** It is a real deck (9 slides, populated `audience`/`goal`,
   `clarity-courseware` 1.19.6) and is stamped `contentSchemaVersion: "1.0.0"`
   like the other six. Its `deck.json` is minified rather than pretty-printed,
   which is why a naive grep appears to show the field missing — worth knowing
   before writing any tooling that reads these manifests by pattern rather than
   by JSON parse.

### Validation Session 2, pass 3 (2026-08-26) — actionable-section sweep

Passes 1–2 checked cross-references and prose. Pass 3 checked the sections an
implementer actually executes — Implementation Steps, Todo Lists, Success
Criteria — and found revision 2 had reached almost none of them. Every fix from
the earlier passes had landed only in amendment blockquotes and Next Steps.

Defects found and fixed (7):

1. **phase-03 Implementation Steps + Todo List were pure revision 1** —
   "Remove the `### On-Slide Text`/`### Visual Direction` required-section
   checks entirely", "…a flat field that no longer exists in the schema".
   Executing them deletes v1 validation and breaks all seven decks. Rewritten
   as dispatch-preserving steps 1–8, step 8 being the byte-identical regression
   gate.
2. **phase-03 third Success Criterion contradicted the phase** — required "no
   remaining reference anywhere in the script" to header titles / `icon`.
   Inverted: the v1 block must still contain all of them.
3. **phase-03 Requirements** still said the validator should treat v2 as "the
   **only** valid shape" and that decks are migrated in phase-06. Replaced.
4. **phase-03 Next Steps** referenced "all 6 migrated decks". Now seven
   unmigrated v1 decks, green *via the v1 branch*.
5. **phase-05 had none of the cutover work in its actionable sections** — the
   five actions that actually switch new decks to v2 (both manifest
   `contentSchemaVersion` bumps, both `templateVersion` majors,
   `templates.ts:176` scaffold default, the two skill authoring references, the
   `deck retemplate` refusal) existed only in a blockquote. Added as steps
   8–12 with matching todos and criteria. Stale step 6 (which migrated
   vivimoon) also fixed.
6. **phase-01's docs follow-ups were unrecorded** while every step read `[x]`.
   Added steps 7–9 (v1-frozen framing, scope line 108 to v2, correct the line
   39 example to `"2.0.0"`) as unchecked.
7. **phase-04's amendment claimed "no scope change" but part (b) was one** —
   editing the downstream `clarity-courseware` `data-slides.tsx` to consume
   object `items[]` makes that template v2-shaped while its manifest declares
   v1, so new decks from it would be stamped v1 and rendered by v2 components.
   Removed from phase-04; re-homed in phase-07's Next Steps as part of that
   template's optional owner-initiated migration. `plan.md` phase table row 4
   and locked decision 7 annotated to match.

Also added to phase-02b: an Implementation Step for the
`migrate-slides-to-deck.mjs:126` comment, matching its Success Criterion 7,
which previously had no step producing it.

**Root cause across all three passes:** revisions were written where they were
easiest to write (blockquotes, Next Steps) rather than where they would be
read at execution time. Any future revision to this plan must edit
Implementation Steps, Todo List, and Success Criteria in the same pass, or it
has not been applied.

**Unresolved contradictions: none.** Post-fix sweep greps (`retemplate`,
`migrate .*deck`, "entirely", exact-string dispatch, "only valid shape") return
only correctly-scoped or explicitly-historical hits.

### Validation Session 2, pass 4 (2026-08-26) — full actionable read-through

Read every phase's Requirements / Implementation Steps / Todo List / Success
Criteria / Risk Assessment / Next Steps end to end rather than grepping. Phases
01, 02b, 03, 04, 05, 06, 07 clean. Two stale spots found and fixed, both in
Risk/Next-Steps prose of already-revised files:

1. **phase-02** — step 7, Risk Assessment, and Next Steps still described
   phase-06 as "deck migration" and treated this phase as highest-blast-radius
   because it replaced the only parser. Rewritten: phase-02b removes the blast
   radius by making this the v2 branch; the residual risk moves to dispatch
   correctness. Also dropped a Success Criterion referencing the
   concept-diagram tweak that moved out of phase-04 in pass 3.
2. **phase-05** — Risk Assessment still said a linear-dark mistake "surfaces as
   a visible regression once phase-06 migrates that deck", contradicting this
   same file's Next Steps. Rewritten: both templates are unverifiable by real
   content; the first deck created after the phase-07 release is the real first
   test.

**Status: no known defects.** Pass 4 found only prose in already-corrected
files, not executable instructions — the first pass whose findings could not
have changed implementation behavior.
