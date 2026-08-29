# Slide move/add/remove now cascade-rename numeric slide ids

**What changed.** `aideck slide move|add|remove` (`engine/cli/commands/presentation.ts`) now renames every numeric-convention slide id (`slide-NN`) to match its new 1-based array position after any reorder. Previously the shared renumbering pass only updated the `## Slide NN` heading number and re-synced YAML `id`/`type` fields from the (unchanged) `slide.id` — the id itself, `slide.file`, and the `(slide-id)` heading label stayed pinned to the slide's original position forever. Custom non-numeric ids (e.g. `slide-summary`) are left untouched by design.

**Why.** User reported that in practice, after `slide move`, ids don't renumber "especially in `deck.json`". Verified empirically (scratch workspace, real built CLI): array order updated correctly but `slide.id`/`file`/heading label did not — confirming the gap. User explicitly asked for a full cascading rename.

**Implementation.** Replaced `renumberSlides`/`renumberHeading` with a single `writeRenumbered` pass: for each slide, if its id matches `/^slide-(\d+)$/`, rename it to `slide-<index+1>` (zero-padded to the original width), then re-sync `file`, YAML `id`/`type`, and the heading. Collision-proof by construction — each slide's new id depends only on its own old id and its own new index, never on siblings, so no two-pass/temp-id juggling is needed.

Also fixed a latent testability bug exposed while writing regression tests: `addSlide` called `resolveTemplate(findWorkspace(), ...)`, re-deriving the workspace from `process.cwd()` instead of using the workspace already resolved by its caller. Harmless in real CLI usage (same cwd both times) but broke when a test passed a synthetic fixture workspace. `addSlide` now takes `workspace` as an explicit parameter.

**Files:** `engine/cli/commands/presentation.ts`, `engine/cli/tests/deck-lifecycle.test.ts`, `engine/cli/dist/commands/presentation.js` (rebuilt).

**Verification.** `npm run test:lifecycle` (12/12 pass, incl. 2 new regression tests: cascading rename on move, custom id preserved), `npm run test:boundary` (12/12 pass), `npm run build` + `npm run build:check` clean pending commit. `npm run test:smoke` fails on an unrelated pre-existing environment restriction (`EALLOWSCRIPTS` — sandboxed npm install policy), not touched by this change.

**Follow-ups:** none.
