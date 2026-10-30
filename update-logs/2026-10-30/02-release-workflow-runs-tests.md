# Release workflow runs the tests

**What changed**
- `.github/workflows/engine-release.yml` now installs the export tools (chromium, imagemagick) and adds `npm run build:check` and `npm test` to its validation step. Before this it ran only lint, typecheck and validate.

**Why**
- v1.4.0 was released with a failing unit test (see `01-release-v1-4-0.md`). Engine CI caught the failure on `main`, but nothing stopped the tag from creating the release. Now a failing test or a stale CLI build stops the workflow before it packs and publishes.

**Follow-ups**
- This runs for the first time on the next tag. Engine CI runs the same steps on the same runner image and passes on `main`.
