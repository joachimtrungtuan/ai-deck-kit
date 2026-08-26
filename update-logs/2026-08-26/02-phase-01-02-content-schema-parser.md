# Phase 1–2: content.md schema and engine parser

## What changed

- Rewrote `docs/deck-format-spec.md` as the canonical new-schema contract:
  structural slide headings, YAML-only titles, unified object `items[]`, typed
  overrides, per-type field reference, ownership, target validation, and locked
  decisions.
- Replaced the preview parser's flat metadata reader with the `yaml` package,
  removed old heading/On-Slide Text derivations, preserved recursive morph
  anchors, and mapped `description`, `stats`, `regionSeries`, `index`,
  `consequences`, and `override` from YAML.
- Updated CLI scaffolding and section callers for the new header; escaped YAML
  scalar values so generated titles remain valid with quotes/newlines.
- Rebuilt committed CLI distribution and added focused scaffold/parser-contract
  assertions.

## Verification

- `npm --prefix engine run typecheck` — pass.
- `npm run test:lifecycle` — 6/6 pass.
- `npm run test:boundary` — 12/12 pass.
- `npm run test:serve` — 34/34 pass with local listener permission.
- `npm run build`, `npm run lint`, `npm run validate`, `git diff --check` — pass.
- `ak plan validate plans/260826-1000-content-md-schema-redesign` — pass.
- Independent tester and code-reviewer passes completed; the review blocker on
  typed `override.layout`/`override.animation` was fixed and re-reviewed.

## Follow-up

Phase 3 must update the validator before any new-schema deck is called valid.
Phases 4–6 remain pending; real deck migration is intentionally not part of
this change.

## Environment note

`ak plan use`/normal plan-index synchronization could not write `.git` or the
default AgentKit store in this sandbox. Repository Markdown remains canonical;
phase checkboxes and the human-readable plan status were updated, and a
writable temporary `AGENTKIT_HOME` was used for reindex attempts.
