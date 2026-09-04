# Kit reliability fixes

**What changed:** Fixed all 15 findings (F1-F15: 3 HIGH, 4 MEDIUM, 8 LOW) from `plans/reports/code-review-260904-1035-kit-reliability-review.md` ([05-kit-reliability-code-review.md](05-kit-reliability-code-review.md)).

- **F1** — `engine/package-lock.json` now committed; install uses `npm ci` instead of `npm install` so every install resolves the same dependency tree.
- **F2** — `vite-plugin-singlefile` moved from `devDependencies` to `dependencies` (it's runtime-imported by the export build). Storybook stays a devDependency and continues shipping to consumers — that's intentional, not the misclassification.
- **F3** — Claude hook commands registered at a project-root `.claude` home now use `$CLAUDE_PROJECT_DIR` instead of baking in a machine-specific absolute path; a home found further up the tree still uses the absolute path. Stale registrations (old path, same hook file) are replaced instead of duplicated.
- **F4** — `init` and `upgrade` detect an engine copy that didn't finish (missing preview-runtime readiness or integrity manifest) and resume instead of erroring "already initialized" or silently reporting "up to date".
- **F5** — Non-interactive `init`/`skills wire` now prints a one-line notice when Claude safeguard hooks are skipped, and `--safeguards` installs them non-interactively.
- **F6** — `unpack` rejects zip entries with symlink permission bits and refuses to overwrite an existing bundle name in the target dir unless `--force`. `pack`/`unpack` argument parsing no longer mis-shifts positionals around `--out`/`--to`.
- **F7** — `resolver.mjs` reports a clear error instead of a raw stack trace when `ai-deck-kit.json` isn't valid JSON.
- **F8** — `config --set engineRoot/decksRoot` refuses a path that resolves outside the project root.
- **F9** — New `aideck skills unwire` (and `unwireSkillsFromProject`) removes skill symlinks, Claude safeguard hooks, and `AGENTS.md`/`CLAUDE.md`/`.gitignore` boundary notes. `uninstall` now calls it automatically so nothing dangling is left behind.
- **F10** — `verify`/`doctor` check decks in parallel (`Promise.all`) instead of serially; the async signature change propagates correctly through `core.ts` and `upgrade.ts`'s `afterUpgrade` callback.
- **F11** — `prompt.ts`'s blocking stdin reader replaces a busy-spin loop on `EAGAIN` with `Atomics.wait`-based sleep, and buffers multibyte UTF-8 correctly across single-byte reads instead of mangling them.
- **F12** — `doctor` runs prerequisite checks with `git: "soft"` (it runs against an already-installed workspace and doesn't need git); `init`/`upgrade` keep `git: "hard"`.
- **F13** — `commands/verify.ts` now imports `LEGACY_CONTENT_SCHEMA_VERSION` from `lib/deck.ts` instead of a duplicated `"1.0.0"` literal; `commands/presentation.ts` and `commands/deck-maintenance.ts` now share one `valueAfter` helper (`engine/cli/lib/cli-args.ts`) instead of two divergent local copies.
- **F14** — `scripts/validate.mjs`'s release-tarball check now also asserts `engine/cli/index.mjs`, `engine/cli/dist/index.js`, and `engine/cli/resolver.mjs` are present in the packed npm distributable (the two files `bin` points at, plus the wrapper).
- **F15** — `copyTree` (`engine/cli/lib/fs.ts`) now excludes `preview-app/dist` by path so a local-source `upgrade --source` no longer copies the Vite dev build output alongside `.DS_Store`.

**Why:** User asked to fix everything the review found, including the LOW items — no new test coverage added beyond what falls out of the fixes themselves (scope explicitly excluded "+ new tests").

**Verification:** Full gate run from repo root — `typecheck`, `lint`, `test` (100/100 passing, including two test files updated for F10's async signature), `build`, `validate`, and `node scripts/ci-smoke.mjs` (direct invocation: init → new deck → validate → export html/pdf → engine upgrade → doctor → verify) all pass clean. `npm run test:smoke` fails locally only because this machine's global `~/.npmrc` sets `allow-scripts=@opencode-ai/cli`, which collides with npm's config resolution when `npm ci` runs nested inside another `npm run` process — confirmed unrelated to the fixes (the identical smoke test passes when invoked directly, bypassing the `npm run` wrapper) and not reproducible on a clean CI runner.

**Follow-ups:** None outstanding from the review. `engine/cli/dist/**` needs rebuilding and committing alongside the source changes (`npm run build` already ran; `build:check` will pass once committed).
