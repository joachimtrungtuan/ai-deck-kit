# Phase 09 — Docs, changelog, update log, minor release (1.5.0)

## Context
- All FRs (documentation of behaviour), decision a (PRD §7 reconciliation). CLAUDE.md "Releases", "Update Logs", AGENTS.md lockstep.

## Overview
Priority P1. Status completed (documentation and local 1.5.0 release complete; publication deferred by user choice). Last phase.

## Requirements
- `docs/modules/export-package-module-prd.md` §7 reworded per decision a (single = self-contained; web = folder; export may fetch fonts at build time; page never requests network).
- `docs/modules/export-progressive-html-functional-requirements.md`: close resolved OQs with spike evidence links.
- `docs/system-architecture.md` export pipeline section: modes, data blocks, loader, CSP step, headless check.
- `engine/skills/presentation-crafting/SKILL.md` (edit in `engine/skills/` only): `--mode`, server-header note, CSP failure handling.
- CLI help text already updated in Phase 03; verify.
- Changelog `## 1.5.0 — YYYY-MM-DD`.

## Steps
1. Docs updates above; verify claims against code and tests.
2. Gates on branch; `git merge --no-ff <branch> -m "merge: progressive html export"`.
3. Lockstep bump commit `chore(release): bump to 1.5.0`: `package.json`, `engine/package.json`, `engine/package-lock.json`, `engine/engine.version.json`, `ai-deck-kit.json` (no `contentSchemaVersion` change expected; grep to confirm).
4. Annotated tag `v1.5.0` on `main`; push `main`, then tag. Wait for Engine Release workflow; never `gh release create`.
5. `gh release edit v1.5.0 --title ... --notes-file ...` (Added/Changed/Fixed/Docs/Upgrading, full changelog link from v1.4.1).
6. Update log `update-logs/YYYY-MM-DD/NN-progressive-html-export-release.md` with version, tag commit, workflow result, Marusei AC results.

## Tests
No new tests; full suite must pass.

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`; workflow run green with `ai-deck-kit-1.5.0.tgz` + `engine.version.json` attached.

## Todo
- [x] PRD §7
- [x] FR doc OQs
- [x] Architecture doc
- [x] SKILL.md
- [x] Changelog draft
- [x] Documentation review and update log
- [x] Merge + lockstep bump + annotated tag on main
- [x] Local release evidence, notes drafts and update log verified

## Reconciled evidence — 2026-11-15
Documentation approved in [review-phase-09-docs.md](reports/review-phase-09-docs.md). All five gates passed at source `15b453c` (228/228 tests). [Manual acceptance](reports/manual-acceptance.md) records AC-1..10; [CLI diagnosis](reports/debug-cli-browser-launch.md) closes the managed-sandbox launch concern. Reviewed documentation committed as `4e0bcda`. Local main merge, 1.5.0 version bump and annotated tag are complete; see [local verification](reports/local-release-verification.md). User explicitly chose **“Keep releases local”** on November 15; local delivery is complete. No public release claimed.

## Risks / rollback
Workflow failure after tag → fix on `main`, cut 1.5.1; never re-tag a pushed tag.

## Deferred by user choice — 2026-11-15
GitHub pushes, Engine Release workflows/assets, hosted release-note edits and publication-result logs remain unexecuted, intentionally outside this delivery. Original steps 4–6 retain the future publication procedure; their external portions no longer gate this accepted local-only scope. Local notes drafts remain available. No further approval is pending for current delivery.
