# Release v1.4.0

**What changed**
- Merged `fix/presenter-ui-feedback` into `main` (`365f4d7`).
- Bumped the version to 1.4.0 in `package.json`, `engine/package.json`, `engine/package-lock.json`, `engine/engine.version.json` and `ai-deck-kit.json`, and added a changelog entry (`b0db018`).
- Tagged `v1.4.0` on `b0db018`. The Engine Release workflow (run 41007470023) succeeded and attached `ai-deck-kit-1.4.0.tgz` and `engine.version.json`. Release notes were added with `gh release edit`.

**Why**
- To ship the presenter layout, clock bar and navigation fixes.

**Follow-ups**
- `engine/cli/tests/verify-slide-type-catalog.test.ts` hard-coded the engine version, so one test failed after the bump and was pushed with the tag. Fixed in `08059d6` on `main`: the test now reads `engine.version.json`. That commit comes after the tag. The released package isn't affected, because the change is only in a test.
- The Engine Release workflow doesn't run `npm test`. Consider adding it so a failing test blocks a release.
