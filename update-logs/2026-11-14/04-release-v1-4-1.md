# Release v1.4.1 (prepared locally)

**What changed**
- Merged `fix/export-asset-dedup` into `main` (`--no-ff`, "merge: export asset de-duplication"). The branch carries the export asset de-duplication fix and the progressive HTML export requirements docs.
- Bumped the version to 1.4.1 in `package.json`, `engine/package.json`, `engine/package-lock.json`, `engine/engine.version.json` and `ai-deck-kit.json` (`15e666d`). `contentSchemaVersion` is unchanged.
- Added the `## 1.4.1 — 2026-11-14` changelog entry (`324532d`).
- Tagged `v1.4.1` (annotated) on `324532d`.
- Release notes drafted at `plans/reports/release-notes-v1.4.1.md` (gitignored; for the later `gh release edit`).
- Gates passed on the branch and again on `main` after the bump: `npm test` (178 pass), `build:check`, `lint`, `typecheck`, `validate`.

**Why**
- To ship the smaller standalone HTML export (each image embedded once; 29.5 MB to 15.8 MB on the reference deck).

**Follow-ups (pending user approval)**
- Push `main`, then push the `v1.4.1` tag.
- Let the `Engine Release` workflow create the release, then run `gh release edit v1.4.1 --title "v1.4.1 — embed each export image once" --notes-file plans/reports/release-notes-v1.4.1.md`.
- Record the workflow run result here once it finishes.
- `release-manifest.json` still says 1.4.0; it is a leftover ClaudeKit file that earlier releases did not touch, so it was left alone.
