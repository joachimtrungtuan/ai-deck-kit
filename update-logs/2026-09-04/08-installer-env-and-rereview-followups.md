# Installer env sanitising and re-review follow-ups

**What changed:** Fix pass for the re-review findings in `plans/reports/code-review-260904-1728-kit-reliability-rereview.md` (N1–N5, F13 leftovers, docs gap). Decisions taken with the user via question prompts: strip all `npm_config_*`, relabel `agentation` as a runtime dependency, re-copy a deleted engine folder on `init`, targeted tests only.

- **N1 (HIGH)** `engine/cli/lib/engine-dependencies.ts`: new `npmChildEnvironment()` drops every `npm_config_*` variable before spawning the nested `npm ci`, so the child re-reads `.npmrc` itself instead of receiving the parent npm's config as flags (npm 12 rejects e.g. `allow-scripts` in project-scoped installs). Failure hint now says npm printed the reason above, rather than asserting a network problem.
- **N2** `engine/package.json` + lockfile: `agentation` moved from devDependencies to dependencies (serve-time annotation overlay).
- **N3** `engine/cli/commands/init.ts`: `resumableWorkspace` re-copies the engine from the distribution when the pointer exists but the engine folder is gone; copy logic shared with fresh init via `copyDistributionEngine`. Exported for tests.
- **N4** `engine/cli/resolver.mjs`: pointer without a string `engineRoot` gets a friendly error instead of a raw stack.
- **N5** `update-logs/2026-09-04/06-kit-reliability-fixes.md`: verification note corrected — the local `test:smoke` failure was the N1 bug, not a quirk.
- **F13** `generation.ts`, `wire-skills.ts`, `removal.ts`: private `valueAfter` copies replaced by `lib/cli-args.ts`. `--outline` and `--to` now reject a missing value instead of reading `undefined`.
- **Docs** `README.md`, `docs/deployment-guide.md`: `--safeguards` flag documented.
- **Tests** `engine/cli/tests/install-reliability.test.ts` (5 tests): env stripping; install under a fake parent-npm env succeeds; failure hint wording; init resume in all three states incl. deleted engine folder; resolver shim error paths (no pointer, invalid JSON, no `engineRoot`, missing engine).

**Why:** The headline `npx github:… init --here` command failed on any machine whose `~/.npmrc` carries an option npm 12 forbids in project-scoped installs, with a misleading hint. Remaining items were small residuals from the earlier fix pass.

**Verification:** typecheck, lint, validate, tests 105/105 green. `build:check` reports the recompiled `engine/cli/dist/**` as pending commit (expected until committed). Real-path proofs: `npm exec --yes --package=<packed tarball> -- ai-deck-kit init --dir tools/ai-deck-kit` with the polluting `~/.npmrc` (`allow-scripts` set) → exit 0, `.engine-integrity.json` written (previously EALLOWSCRIPTS); `npm run test:smoke` (the nested path that failed in log 06) → "CI smoke passed", exit 0.

**Follow-ups:** Commit source + compiled `dist` together. Broader test backfill (unpack policy, hook portability, unwire, safeguards notice) deliberately deferred per user choice.
