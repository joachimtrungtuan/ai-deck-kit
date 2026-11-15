# End of session: progressive HTML export, orchestrated build

## Session goal

The user's request (via `/ak-cook`): run every phase of the active plan `plans/261114-0021-progressive-html-export/` (phases 01–09) through subagents, one phase at a time. After each phase, run a code review (ak:code-review) and fix every gap it finds. The main agent orchestrates only and does not implement. Close the plan with no defects or gaps left.

**Release authorization (user decision):** do merges, version bumps and tags locally. Ask the user before ANY push to GitHub, including main, tags and `gh release edit`.

## Completed (DONE — skip these)

- **Phase 01: asset dedup and the 1.4.1 patch release.** Merged to `main`. The release is prepared locally at `72a606b`, tag `v1.4.1`. It is **not pushed**. Log: `03-export-asset-dedup.md`, `04-release-v1-4-1.md`.
- **Phase 02: browser and CSP spikes.** All seven spikes passed. Report: `plans/261114-0021-progressive-html-export/reports/spike-results-progressive-export.md`; fixtures in `spikes/`.
- **Phase 03: `aideck export html --mode single|web`.** Implemented in `d75d168` and logged in `d0eae88`. The review found no critical or high issues, and every finding was fixed in `c38271e`. Tests: 190/190, and all gates pass. Log: `05-export-mode-flag.md` (it has a "Review fixes" section).

## In progress

- **Phase 04: asset loader and slide gate.** An implementer subagent was dispatched on `feat/progressive-html-export` after `c38271e`. It was told to write `update-logs/2026-11-14/06-*.md` and to commit.
- **Check its state first:** run `git log --oneline c38271e..HEAD` and look for log 06.
  - If the work is incomplete or uncommitted, finish or redo phase 04 from `phase-04-asset-loader-and-slide-gate.md`.
  - If it is committed, run its code review and the fix pass.

## Remaining

1. **Phase 04:** code review, then fix every finding, with the gates green.
2. **Phases 05–08**, each implemented, then reviewed, then fixed, in order:
   - **05: single-mode data blocks and web preload.** Override CSS: hash each override CSS string at export, per the spec's style-src hash row. Use `'unsafe-inline'` only if the user confirms it.
   - **06: meta CSP, referrer and frame-busting.** Include the still-frame fix described below.
   - **07: external-source scan and font embedding.** Embed the Marusei Google Fonts `@import` as `data:`, per FR-76.
   - **08: headless CSP check.**
3. **Phase 09:**
   - Docs: SKILL.md export section, `references/export-workflow.md`, README.
   - Changelog, then prepare 1.5.0 locally: merge `--no-ff` to main, lockstep version bump, annotated tag.
   - Manual checks on a scratch copy of the Marusei deck for AC-1/2/3/4/10, plus the Safari and Firefox items.
4. **Close the plan:**
   - Set the statuses in `plan.md` and in each phase file.
   - Write the update logs.
   - Then **ask the user** before pushing main, `v1.4.1` and `v1.5.0`, and before `gh release edit`.
   - Note for the user: `release-manifest.json` is still at 1.4.0, and the `aideck upgrade` line in the release notes is untested.

## Key decisions

- **Decisions a–h are closed.** See `plans/reports/advise-261114-0021-progressive-html-export-decisions.md`:
  - connect-src 'none'.
  - Assets are copied only in web mode.
  - 15 MB is a soft target.
  - Only referenced assets are embedded.
  - The app script is inline with a hash in both modes.
  - The validators check font licences; export only warns.
  - The frame-buster acts only when the page is framed cross-origin.
- **Facts from the spikes that later phases must follow:**
  - The app is a classic IIFE in `<body>`, placed before the data blocks. No import.meta, no dynamic import, no crossorigin.
  - An external `type=module` script fails over file://. Web mode may only use inline hashed scripts or external classic scripts.
  - Hash the exact script text.
  - React `style={{}}` and the CSSOM are allowed under the CSP. Parsed `style=` attributes and new `<style>` text are blocked.
  - The mirror-frame `freeze()` STILL_FRAME_CSS injection is blocked under the CSP. Fix it with a hashed rule `html[data-still] :is([class*="ld-anim"],[class*="swiss-anim"],[class*="cc-anim"],[class*="primitive-anim"]){animation:none!important;clip-path:none!important;transform:none!important;opacity:1!important}` and have the parent set `data-still`, or use adoptedStyleSheets.
  - The CSP reporter is the first hashed classic script. It writes `html[data-csp-violations]` and `data-csp-check=ran`. If `data-csp-check=ran` is missing, the check itself failed.
  - Web-mode print needs an explicit wait for images to decode.
  - An unquoted `url(assets/x)` in override CSS is missed by embeddedAssetPattern (edge case).
- **The `aideck present` stale check uses file timestamps only.** The review judged it not a defect and it is logged as a follow-up. Present always rebuilds in single mode.

## Files touched (by phase 03 and its fixes)

- `engine/cli/commands/output.ts` and `engine/cli/dist/commands/output.js`: `--mode` parsing and help.
- `engine/preview-app/deck-asset-table.ts`: `assetDelivery`; linked keys are URL-encoded.
- `engine/preview-app/vite-deck-plugin.ts`: linked mode emits only referenced assets. The file is over the size cap and was not split.
- `engine/vite.export.config.ts`: IIFE build, driven by `AIDECK_EXPORT_MODE`.
- `engine/skills/presentation-crafting/scripts/export-standalone-html.mjs`: `--mode` / `--mode=` validation.
- `engine/skills/presentation-crafting/scripts/export-html-assembly.mjs` and its `.d.mts`: moves the app into a classic in-body script.
- Tests: `engine/cli/tests/export-mode-flag.test.ts`, `export-asset-url-encoding.test.ts`, `export-deck-fixture.ts`.
- `docs/modules/export-package-module-prd.md`: corrected the export syntax.

## Unresolved questions / blockers

- Override CSS hashing versus `'unsafe-inline'` (phase 05): the default is to hash. Ask the user only if hashing is not workable.
- Firefox headless would not start, so it is untested. Safari is untested for the data-still rule and adoptedStyleSheets. Both go to phase 09's manual checks.
- No test covers an asset file name with a space. The encoding handles it.

## Pickup pointer

- **Constraints:**
  - Gates: `npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`.
  - Do not kill the user's Vite servers: PIDs 89485, 87510, 81364, 6737, 5491.
  - Treat the Marusei project as read-only; work on scratch copies.
  - No plan, phase or finding IDs in code or commits.
  - Run subagents one at a time.
  - Number further update logs from 08.
- **First action:** on `feat/progressive-html-export`, run `git log --oneline c38271e..HEAD` and `ls update-logs/2026-11-14/` to see whether phase 04 landed. Then continue with the phase 04 review.
