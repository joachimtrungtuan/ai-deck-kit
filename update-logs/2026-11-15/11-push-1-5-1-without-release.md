# Push 1.5.1 to main without a release

**What changed**
- Committed the DOM-dump fix (log 10). Bumped the version to 1.5.1 in lockstep: `package.json`, `engine/package.json` + lock, `engine/engine.version.json`, `ai-deck-kit.json`. Added the 1.5.1 changelog entry, which also covers the codebase-review fixes that reached main after 1.5.0.
- Gates passed: `npm test` 235/235, `build:check`, `lint`, `typecheck`, `validate`.
- Pushed `main` with `--no-follow-tags`. No tag was pushed, so no release was created.

**Why**: the user wants to run `aideck upgrade` (plain `aideck upgrade` fetches `github:…` main) and test the fix on the Vân Tay Media pitch-decks project before confirming a release.

**Follow-ups**
- After the user confirms: create an annotated tag `v1.5.1` on this main commit, push the tag, let the Engine Release workflow create the release, then `gh release edit` the notes.
- Local unpushed tags `v1.4.1`/`v1.5.0` still need a decision. `v1.5.0` predates the review fixes, so 1.5.1 may supersede it.
