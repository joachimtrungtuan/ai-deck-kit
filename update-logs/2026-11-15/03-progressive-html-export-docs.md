# Progressive HTML export docs — 2026-11-15

## What changed

- Updated README, export package PRD, functional requirements, system architecture,
  `presentation-crafting/SKILL.md`, and `references/export-workflow.md` for the
  accepted `single|web` contract, progressive loader/gate, source scan, font
  embedding, strict CSP, frame refusal, and headless check.
- Added the v1.5.0 installer-facing release-note draft and changelog entry.
- Superseded stale Safari/CSP and managed-sandbox CLI wording in the phase evidence
  reports with the final native-browser and picker evidence.

## Why

Phase 09 needs the current implementation and evidence represented in the smallest
owning documentation surfaces. The docs distinguish web mode's necessary adjacent
same-origin asset loads from external runtime network access and do not claim that
v1.5.0 has been published.

## Verification

- `repomix --version` → 1.19.0; regenerated `repomix-output.xml`.
- Scoped source/path checks confirmed the CLI `--mode` help, export scripts, CSP
  assembly, source scan, font embedding, and headless checker owners.
- Version files remain 1.4.1; no merge, tag, push, release, or production code change
  was made.

## Follow-ups

Release authorization, lockstep version bump, merge to `main`, tag, push, and release
workflow remain with the parent agent and require the stated user approval before
remote actions.
