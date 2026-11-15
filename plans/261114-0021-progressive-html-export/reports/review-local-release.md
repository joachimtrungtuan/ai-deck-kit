# Local release review — 2026-11-15

Status: DONE. Local release is approval-ready; the plan-index correction below resolved. No product defect or publication blocker found. External publication remains pending approval.

## Scope

Read release rules, code-review skill, plan index, phases 01/09, final-plan-status and local-release-verification reports, both release-note drafts, changelog, tracked local-release update log. Inspected local refs, five version files, package inventory/content, saved gate logs and real upgrade evidence. No source edits or repeated full suite. Controller authorized the plan-index fix and this report; no process started or external write performed.

## Verified

- Main `f971d69` contains merge `6830ee7`, then release commit `160dde7`. Both annotated tags are ancestors of main; 1.4.1 is ancestor of 1.5.0.
- `v1.5.0` tag object `b8b794ee7db341ca76117db89fcadc40b4739ca9` targets `160dde7f17c05a3abbf0a9c256b618e6f2ed4143`. Existing annotated `v1.4.1` targets `324532d77fafdd452644dd6e82e32c6bc19a0648`.
- Root package, engine package, engine lockfile (including packages root), engine version manifest and root pointer agree on 1.5.0. No root package-lock exists; not a missing lockstep update. Content schema remains 3.2.0 in manifest and CLI source.
- Actual tarball SHA-256 is `47e03086a08d9e98854fb27860da6c68c232e228eeed33f045aa42d01714c41f`. All 361 packaged entries match their current workspace counterparts byte-for-byte. Export helpers/declarations, compiled CLI and preview runtime are included. No root user decks/templates, private Marusei data, plans, update logs, dotenv or agent-home paths included.
- Saved premerge test log: 228 pass, zero fail/skipped/cancelled. Postbump build:check, lint (22 JS files), typecheck and validate logs confirm success. Build check confirms committed CLI matches source.
- Actual unpacked-package install and supported 1.4.1→1.5.0 upgrade logs match the report. Fresh SHA-256 comparison confirms all 44 seeded user files preserved; upgrade reports one valid template and deck.
- 1.5.0 changelog date is November 15. 1.4.1 retains November 14, matching its immutable tagged changelog; changing historical date is unnecessary. Notes compare links correctly use v1.4.0...v1.4.1 and v1.4.1...v1.5.0.
- Exactly three unchecked tasks remain: Phase 01 publication/log, Phase 09 published notes and publication-result log. Thus 54/57 and overall in-progress are truthful. Tracked update log explicitly says workflow not run. No false publication claim.

## Findings

Critical/high/medium: none.

Low, resolved:

1. `plan.md:74–75` still says local 1.5.0 release pending and 53/57, contradicting completed local preparation and final-plan-status. Corrected to local preparation complete/publication pending and 54/57 (94.7%); in-progress retained.
Phase 01 notes link `../reports/release-notes-v1.4.1.md` is correct: it resolves to `plans/reports/release-notes-v1.4.1.md`. An initially proposed change to that link was rejected by a filesystem existence check; original link retained.

Canonical CLI readback after correction: validate valid; status in-progress, 7/9 phases, 54/57 tasks. `git diff --check` clean.

## Next

Controller presents the concrete publication approval. After approval: push main before existing tags, publish 1.4.1 then 1.5.0 through Engine Release, verify workflow and attached assets, edit notes, record results and close remaining tasks. Never create release manually. Registry-backed clean install remains unverified and is already disclosed.

Unresolved questions: none in implementation. GitHub publication awaits user approval.
