# Release v1.5.2

**What changed**

- Released v1.5.2: https://github.com/joachimtrungtuan/ai-deck-kit/releases/tag/v1.5.2
  - Tag: annotated `v1.5.2` (object `bc803e4`) on `main` commit `1bfad16`.
  - Assets attached by the workflow: `ai-deck-kit-1.5.2.tgz`, `engine.version.json`.
  - Title + notes applied with `gh release edit`. The notes roll up 1.4.1 → 1.5.2, because the previous GitHub release was v1.4.0. Compare link: `v1.4.0...v1.5.2`.
- First Engine Release run (43748428410, tag on `99f7ad7`) **failed** at "Validate release". `export-google-fonts-embed.test.ts` read the gitignored `decks/presenter-test.deck`, which CI doesn't have (ENOENT).
  - Fix `1bfad16`: the test now uses the committed showcase fixture (`workspaceWithDeck` / `exportDeck` from `export-deck-fixture.ts`).
  - Verified with the local deck hidden. All gates green (`npm test` 235/235, build:check, lint, typecheck, validate).
- With user approval, moved the `v1.5.2` tag from `99f7ad7` to `1bfad16`: deleted it on origin, re-tagged, pushed with `--no-follow-tags`.
  - Engine Release run 43795981276 **succeeded**.

**Why:** the release rule requires a tagged GitHub release for every version that reaches `main`.

**Correction to `2026-11-15/14-bump-1-5-2-and-push-main.md`:** `v1.4.0` *is* on origin. Only `v1.4.1` and `v1.5.0` are local-only tags, and they remain unpushed.

**Follow-ups**

- Decide whether to delete the stale local tags `v1.4.1` and `v1.5.0`. Never publish them.
- 4 moderate dev-only advisories remain (glob/minimatch via the Storybook docgen plugin). They await an upstream fix.
