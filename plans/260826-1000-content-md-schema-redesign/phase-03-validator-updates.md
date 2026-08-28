---
phase: 3
title: "Validator Updates"
status: completed
priority: P1
effort: ""
dependencies: [1]
---


> **Revision 2 amendment (2026-08-26) — scope changed before execution.** This
> phase must now **dispatch** rather than replace. Read `deck.json`'s
> `contentSchemaVersion` and branch:
>
> Branch on the **major version only**, never the exact string — real decks and
> templates already drift on minor (`linear-dark` declares `1.1.0` against decks
> declaring `1.0.0`), so an exact-match branch would send valid v1 decks to the
> "unsupported" arm on day one.
>
> - `1.x` → today's existing validation rules, preserved unchanged. The
>   seven frozen decks must keep passing exactly as they pass now; a v1 deck
>   must never be judged against a v2 rule.
> - `2.x` → the new rules this phase was written to add (YAML-only `title`,
>   object `items[]`, typed `override`, per-type field validation).
> - any other major (or an unparseable value) → fail loudly naming the deck, the
>   value, and the supported majors. An absent field reads as `1.0.0`.
>
> Mirror the parser dispatch from
> [phase-02b](phase-02b-v1-compatibility-dispatch.md) so the two never disagree
> about which schema a deck is: a deck that parses as v2 and validates as v1
> is worse than either failing outright.
>
> Same freeze discipline as the parser: keep the v1 rule set as its own block
> and do not "unify" shared checks between the two — a shared check later
> tightened for v2 would silently start failing frozen decks.
>
> `docs/deck-format-spec.md:214` ("the current validator remains an old-format
> validator until the deck migrations land") describes a migration that is no
> longer happening and needs rewording alongside this work.
# Phase 03: Validator Updates

## Context Links
- [plan.md](plan.md) — locked decisions this phase enforces (1, 2, 4, 5).
- [phase-01-canonical-schema-and-docs.md](phase-01-canonical-schema-and-docs.md) —
  §6 Validation bullets this phase implements as executable checks.
- [phase-02-engine-parser-and-cli.md](phase-02-engine-parser-and-cli.md) —
  same `yaml` parsing approach this phase reuses (Next Steps note in
  phase-02).
- `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs` —
  confirmed exact path this session via `find`; referenced by name in
  `CLAUDE.md`'s "Validate before handoff" rule.

## Overview
- Priority: depends on phase-01 (schema contract); independent of phase-02's
  files (different script) but should reuse phase-02's `yaml`-parsing
  approach rather than inventing a second regex-based reader for the same
  format.
- Status: completed (2026-08-26).
- Update `validate-slide-content.mjs` so it enforces the new schema (YAML-only
  title, unified `items[]`, merged `override` object) instead of the old
  header-title/flat-`icons[]`/`### On-Slide Text` format it currently checks.

## Key Insights
- The validator currently has its own header-title-dependent `slideMatches`
  regex (mirrors the old `## Slide N: Title` assumption) and hardcoded
  required-section checks for `### On-Slide Text` / `### Visual Direction` —
  both of these are stale the moment phase-01's schema lands, regardless of
  what phase-02 does to the parser. This phase must not wait on phase-02
  landing first (no shared files), but its correctness depends on matching
  phase-01's canonical shape exactly, not phase-02's specific implementation.
- **Revision 2 replaces the original bullet here.** It read: "the validator
  should treat the new schema as the **only** valid shape … every real deck is
  migrated in phase-06 … a deck still on the old format is expected to fail
  validation loudly." That is now wrong on every clause — no deck is migrated,
  and a v1 deck failing validation is the top regression this phase must
  prevent. The rule is: the v2 rules below apply to `2.x` decks only; a `1.x`
  deck is judged by the preserved v1 rules and must pass exactly as it does
  today.
- Every requirement below describes the **v2 branch**. None of them may be
  applied to a `1.x` deck.
- Icon validation today likely only looks at a flat `icons[]`/`icon` field
  (needs confirming against the real script at implementation time, not
  guessed here) — this must be replaced with a walk of `items[].icon` at any
  nesting level, matching phase-02's `collectMorphAnchors`-style recursive
  walk pattern for consistency rather than a bespoke traversal.

## Requirements
- Every `items[]` entry has a non-empty `title` (phase-01 §6, bullet 1).
- `items[].column`, when present, is exactly `"left"` or `"right"` (phase-01
  §6, bullet 2).
- `override.css` or `override.html`, when either is set (non-empty), require
  `override.reason` to also be non-empty (phase-01 §6, bullet 3; plan.md
  decision 4).
- `override.css` must not contain an unescaped `</style>`; `override.html`
  must not contain `<script` (phase-01 §6, bullet 4 — a basic containment
  check against a mis-authored override breaking out of its wrapper, not a
  general XSS sanitizer; decks are trusted-author content per phase-01's
  Security Considerations).
- Icon fields are validated wherever they appear in `items[].icon` (any
  nesting level reachable via the recursive item walk) — there is no separate
  flat `icon`/`icons` field to validate anymore, since phase-02 removes those
  from the schema entirely (in v2; v1 keeps validating them).
- `title:` must be present and non-empty in the YAML block for every slide —
  replaces any header-text-based title check.
- `### On-Slide Text` / `### Visual Direction` are no longer required or
  recognized sections — remove their required-section checks entirely
  (decision 5); do not warn on their presence or absence.

## Implementation Steps

> Revision 2: every "replace"/"remove" below is **v2-branch-only**. The v1 rule
> set is preserved verbatim and keeps running for `1.x` decks. Nothing in this
> phase may delete a check that a v1 deck depends on.

1. Read the current `validate-slide-content.mjs` in full; identify every check
   keyed to the v1 schema: the `slideMatches` header-title regex, the
   required-section list including `### On-Slide Text`/`### Visual Direction`,
   and the flat `icon`/`icons` field the icon check reads today. This set is
   the **v1 rule block**, to be kept, not edited.
2. Read the deck's `contentSchemaVersion` from `deck.json`, parse its major
   component, and branch: `1.x` → v1 rule block, `2.x` → v2 rule block, any
   other major or unparseable value → fail naming deck, value, and supported
   majors. Absent field reads as `1.0.0`. Mirror phase-02b's dispatch exactly.
3. Move today's checks unchanged into the v1 rule block. Do not refactor them,
   do not unify their YAML reading with the v2 block, and do not "fix" anything
   they get wrong — v1 is frozen at its current behavior.
4. Build the v2 rule block as a separate function. Within it only:
   a. Use the `yaml` package for metadata, mirroring phase-02's `parseMetadata`.
   b. Require a non-empty YAML `title:`; no header-title fallback.
   c. Do not require `### On-Slide Text` / `### Visual Direction`.
   d. Check `items[]`: non-empty `title` per entry; `column` is `left`/`right`
      when present.
   e. Check `override`: `reason` required when `css`/`html` set;
      `</style>`/`<script` containment.
   f. Walk `items[].icon` recursively (matching phase-02's `collectMorphAnchors`
      traversal) for the icon check.
5. Accept the deliberate duplication between the two blocks' YAML reading and
   shared helpers, and add a comment saying so. Unifying them is the exact
   change that would silently un-freeze v1.
6. Smoke test v2: phase-01's canonical example slide passes clean.
7. Smoke test v2 negative: a deliberately broken example (missing `title`,
   `override.css` without `reason`, `items[]` entry with empty `title`) fails
   with a clear, specific message per violation.
8. **Smoke test v1 (the regression gate):** run the validator across all seven
   existing decks. Every one must pass exactly as it passes today. Capture
   before/after output and diff it — any difference is a failure of this phase.

## Todo List
- [x] Current script read in full; v1 rule block identified.
- [x] Major-version dispatch added, mirroring phase-02b.
- [x] v1 rule block preserved verbatim, not refactored.
- [x] v2 rule block added as a separate function (title / items / override /
      icon-walk / no required prose sections).
- [x] Duplication between blocks commented as deliberate.
- [x] Smoke test: v2 canonical example passes clean.
- [x] Smoke test: v2 broken example fails with specific messages.
- [x] Regression gate: all seven v1 decks validate identically to today
      (before/after output diffed).

## Landed (2026-08-26)

Implemented in `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs`:
dispatch on the major of `contentSchemaVersion` (absent → `1.0.0`, mirrors
`manifest-deck-source.tsx`); v1 rule block preserved verbatim inside the `1.x`
branch with a frozen comment; `validateContentV2()` implements the v2 rules
with its own duplicated helpers (`v2*` prefixed) per the freeze discipline.
Also reworded the stale validator paragraph at `docs/deck-format-spec.md`
§6 ("the current validator remains an old-format gate") to describe the
dual-schema dispatch — the follow-up this phase's amendment flagged.

Evidence: all 7 v1 decks byte-identical before/after output; canonical v2
example passes clean; negative fixtures (missing title, empty item title, bad
column, css-without-reason, `<script` in html, `</style>` breakout, malformed
YAML, unsupported major `9.9.9`) each fail with a specific message;
`1.1.0` fixture routes to v1; engine typecheck + 35 serve tests pass.

## Success Criteria
- Running the validator against phase-01's canonical example slide produces
  zero errors/warnings.
- Running it against a slide with any of: missing `title`, an `items[]` entry
  with empty `title`, an `items[].column` value other than `left`/`right`,
  `override.css` set with empty `override.reason`, or `override.html`
  containing `<script` — produces a clear error naming the specific
  violation and field.
- The **v2 block** contains no reference to header-carried titles,
  `### On-Slide Text`, `### Visual Direction`, or a flat `icon`/`icons` field.
  The **v1 block still contains all of them** — that is required, not leftover.
  (Revision 2 inverted this criterion; under revision 1 it read "no remaining
  reference anywhere in the script", which would delete v1 validation.)
- All seven existing v1 decks produce byte-identical validator output before
  and after this phase.

## Risk Assessment
- Low: single-file change, independent of phase-02's files. Main risk is
  divergence from phase-01's exact field names/shapes if this phase is
  implemented without re-reading phase-01 closely — mitigate by treating
  phase-01's canonical example as the literal, executable test fixture (step
  8) rather than re-deriving field names from memory.

## Security Considerations
- The `</style>`/`<script` containment checks are a basic guard against an
  override accidentally breaking out of its intended scope (e.g. closing the
  `<style>` tag early and injecting unrelated markup into the slide DOM) —
  not a general-purpose sanitizer. `override.css`/`override.html` remain
  trusted-author content per phase-01's Security Considerations; the checks
  here catch authoring mistakes, not adversarial input.

## Next Steps
- Phase-06 used this validator as the v1 freeze gate and is complete.
- No open items remain in this phase.
