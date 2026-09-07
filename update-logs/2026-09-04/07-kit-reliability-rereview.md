# Kit reliability re-review (post fix pass)

**What changed:** Independent re-verification of the F1–F15 fix pass (commits f93ceb6 → efa8f72). Report at `plans/reports/code-review-260904-1728-kit-reliability-rereview.md`. No code changed.

**Why:** User asked for an unbiased check that every reported bug is resolved and whether any outstanding issue still threatens practical reliability.

**Result:** 14/15 resolved as claimed, F2 partial (`agentation` still a devDependency used at serve time), small residuals on F4/F7/F13. All gates green; full `ci-smoke` with real install + exports passes. **New HIGH (N1):** the headline `npx github:… init --here` path fails on machines whose `~/.npmrc` carries an option npm 12 forbids in project-scoped installs (here `allow-scripts`), because the installer's nested `npm ci` inherits `npm_config_*` env vars from npx/npm and treats them as flags. Reproduced via `npm exec` against the packed tarball; the failure hint wrongly blames the network. Pre-existing, not a regression; the fix log misread it as a local test quirk.

**Follow-ups:** Sanitise `npm_config_*` in `engine-dependencies.ts` and fix the error hint (N1); move `agentation` to `dependencies`; guard resolver/init residuals; backfill tests for the fix pass (none were added). Two open questions at the end of the report.
