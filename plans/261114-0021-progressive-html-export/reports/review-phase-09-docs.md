# Phase 09 documentation review — 2026-11-15

Status: DONE

## Scope and compliance

Reviewed the nine pending documentation diffs, v1.5.0 release-note draft, phase 09 requirements, docs-manager report, manual acceptance, final picker review, CLI launch investigation, and November 15 logs 01–03. Compared claims with the narrow CLI/export/CSP/font-validator owners. Documentation scope passes; merge, version bump, tag, workflow publication and published notes remain controller-owned pending work.

## Findings resolved

- Corrected pipeline order: source scanning precedes Vite; Google Fonts imports in generated CSS are rewritten after Vite.
- Clarified licence enforcement: authoring validators block failures; export `fsType` check warns.
- Clarified frame behavior: cross-origin embedding attempts top navigation, then refuses rendering if still framed; same-origin presenter frames work.
- Replaced duplicated browser/Marusei inventories in evergreen requirements with links to stateful reports. Reports retain 29.9 MB versus the 15 MB soft target and the slide-35 equivalent gate because slide 38 has `assets: []`.
- Corrected log 01's obsolete file-URL failure wording using the minimal plain-HTML sandbox control and successful native checker/single/web evidence in log 02.

## Verification

- CLI owner advertises `--mode single|web`; single default and adjacent web assets match the implementation.
- `connect-src 'none'` and post-build font rewriting match CSP/export source.
- Safari 097 custom-picker CSP proof remains valid; final `15b453c` Chrome interaction proof is independently recorded. Historical picker findings are superseded by its final review.
- Existing evidence records 228 passing tests and all five gates passing. No full test rerun for this documentation-only review.
- v1.5.0 changelog date is 2026-11-15; release-note compare starts at v1.4.1; existing v1.4.1 draft retained. No unpublished registry upgrade experiment added.
- `git diff --check` passed; focused relative report links resolve. Ignored regenerated `repomix-output.xml` remains unstaged.

## Handoff

No commit made. Controller/git agent should stage explicit reviewed documentation paths, this ignored report and the release-note draft (force-add only intended ignored files), plus the already-read CLI report and logs 02–03 if intended. Preserve unrelated untracked November 14 log 07. No production source, versions, merge, tag, push, or release changed.

Unresolved questions: none within documentation scope. Release execution remains pending.
