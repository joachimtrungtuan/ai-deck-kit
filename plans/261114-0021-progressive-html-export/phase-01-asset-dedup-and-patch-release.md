# Phase 01 — Asset de-duplication + patch release (1.4.1)

## Context
- Spec §4 (FR-1..6), AC-1, AC-2. Decisions brief: dedup ships alone, first.
- Code: `engine/preview-app/vite-deck-plugin.ts` (`inlineDeckAssets` ~L300-315, called L278), `engine/preview-app/src/content-schema-v2.tsx` (`authoringSlideYamlKeys` L36, not exported), `engine/preview-app/src/fixed-slide-canvas.tsx:119`, `engine/preview-app/src/deck-export.tsx:161`, `engine/cli/tests/serve.test.ts` L95-121.

## Overview
Priority P1. Status completed (local release; publication deferred by user choice). Shippable alone as 1.4.1 (bug fix: no new flags).

## Key insights
- Root cause: regex `/(["'])assets\/([^"']+)\1/g` rewrites every quoted `assets/...` string in raw `content.md` to a data URI, so a file referenced N times is embedded N times, including the authoring-only `assets:` YAML list.
- Slides render in exactly two places (canvas L119, `PrintDeck` L161). One resolver at those two sites covers serve, export, V1 and V2 manifest decks. Generated-source decks (`.build/source/*.tsx`, plugin L262-273) never pass through `inlineDeckAssets` today; the table is built from `content.md` only, so they are out of scope here (parity, no regression).
- `vite-deck-plugin.ts` is already 546 lines (cap ~200): put `collectDeckAssetTable` in its own module next to the plugin rather than growing the plugin file.
- `inlineDeckAssets` is shared by serve and export, so serve gets the same fix for free.

## Requirements
- FR-1 one copy per file. FR-2 one shared table keyed by deck-relative path. FR-3 table built from render props only (authoring keys excluded). FR-4 missing/escaping paths still fail the build. FR-5 Marusei size reported; 15 MB is a soft target (decision d). FR-6 PDF still captures every image.

## Architecture
- Plugin: replace text rewrite with `collectDeckAssetTable(content, deckRoot, watchedFiles)` → `Record<"assets/x", "data:...">`. It splits slides, drops speaker notes (existing `stripSpeakerNotes`), removes `authoringSlideYamlKeys` from each slide's YAML (plugin already imports `yaml`), then collects quoted `assets/...` paths. `content.md` stays with plain paths.
- `virtual:aideck-deck` additionally exports `deckAssets` (the table).
- Runtime: new `engine/preview-app/src/deck-asset-resolver.ts` — `resolveSlideProps(props, table)` walks strings/arrays/objects and swaps `assets/...` keys present in the table. Memoised per slide. Called at the two render sites only.

## Related code files
- Modify: `vite-deck-plugin.ts`, `content-schema-v2.tsx` (export `authoringSlideYamlKeys`), `fixed-slide-canvas.tsx`, `deck-export.tsx`, virtual module type decl (wherever `virtual:aideck-deck` is typed), `engine/cli/tests/serve.test.ts`.
- Create: `engine/preview-app/src/deck-asset-resolver.ts`, `engine/preview-app/deck-asset-table.ts` (holds `collectDeckAssetTable`; name indicative), `engine/cli/tests/export-asset-dedup.test.ts`.
- Release: `package.json`, `engine/package.json`, `engine/package-lock.json`, `engine/engine.version.json`, `ai-deck-kit.json`, `docs/project-changelog.md`, `update-logs/2026-11-14/NN-*.md`.

## Implementation steps
1. Pre-check (OQ-7 subset, stop-and-ask if hit): grep shipped templates (`engine/templates/*.template`) and the Marusei template for CSS `url(`, string `background`/`backgroundImage` props, and any layout that reads `assets/` paths outside props. Anything the resolver cannot reach → stop and ask.
2. Export `authoringSlideYamlKeys` from `content-schema-v2.tsx` (DRY; no copy in plugin).
3. Write `collectDeckAssetTable`; keep FR-4 errors (escape + missing) with current messages. Keep `assetMimeTypes`.
4. Emit `deckAssets` from the virtual module; leave content text unchanged.
5. Add `deck-asset-resolver.ts`; wire at `fixed-slide-canvas.tsx:119` and `deck-export.tsx:161`.
6. Update `serve.test.ts` L95-121 to the new contract (table entries, escape rejection, missing-asset error).
7. Run gates; then manual Marusei export + PDF (below).
8. Release 1.4.1 per CLAUDE.md "Releases": gates green, `git merge --no-ff <branch> -m "merge: <feature>"`; lockstep bump commit `chore(release): bump to 1.4.1` (`package.json`, `engine/package.json` + lock, `engine/engine.version.json`, `ai-deck-kit.json`; no `contentSchemaVersion` change expected, grep to confirm); changelog `## 1.4.1 — YYYY-MM-DD`; annotated tag `v1.4.1` on `main`; push `main`, then tag; wait for Engine Release workflow (never `gh release create`); `gh release edit v1.4.1 --title ... --notes-file ...` (Added/Changed/Fixed/Docs/Upgrading, ending with compare link `v1.4.0...v1.4.1`); update log with version, tag commit + run result.

## Tests (real, no mocks)
- `export-asset-dedup.test.ts`: fixture deck (reuse `fixtureWorkspace()` pattern from `deck-lifecycle.test.ts`) with one PNG referenced by three slides plus an authoring `assets:` list entry for an unreferenced file. Run the real export build; assert the PNG base64 appears exactly once in `index.html`, the authoring-only file is absent, and the build fails for a missing path and a `../` path.
- Resolver unit tests on real prop shapes (`imageSrc`, `images[]`, nested objects).

## Validation
`npm test && npm run build:check && npm run lint && npm run typecheck && npm run validate`
Manual: `aideck export html` + `aideck export pdf` on Marusei; `ls -l` size recorded against the 15 MB soft target (AC-1); open PDF, every image present (AC-2); `grep -o` one occurrence of a known image's leading base64.

## Todo
- [x] Template pre-check grep
- [x] Export authoring keys
- [x] Asset table in plugin + virtual export
- [x] Resolver + two render sites
- [x] Tests updated/added
- [x] Marusei AC-1/AC-2 manual check
- [x] Local 1.4.1 annotated release and update log verified

## Results (steps 1-7 complete; local release complete; publication deferred by user choice)
- Marusei deck (40 slides, 43 assets, 10 MB on disk), standalone HTML: 29.5 MB before, 15.8 MB after (15 MB soft target: 0.8 MB over, floor is the unique image bytes as base64). Duplicated assets: 41 before, 0 after (full-base64 count per file).
- cover-salmon-bowl.jpg full base64: 2 copies before, 1 after. Unreferenced files (prose mention only) absent in both.
- PDF: 40 pages both; page rasters before vs after match (max 0.5% pixels differ, render noise only); p-17 checked visually.
- Added: symlink in assets/ pointing outside the deck fails the build (realpath check).

## Success criteria
AC-1, AC-2 pass; serve preview unchanged visually; all gates green; annotated local release verified. Original hosted-asset criterion superseded for this delivery by the November 15 local-only decision.

## Risks / rollback
- Prop shapes not covered by the walker (e.g. CSS strings) → images vanish. Mitigate by step 1 grep and the PDF check. Rollback: revert the merge commit; table + resolver are additive and isolated.
- Size well above 15 MB after dedup suggests a missed duplicate; investigate, but a slight overshoot does not block tagging (decision d).

## Security
Path escape check stays (FR-4). No new network or eval.

## Next
Phase 02 spikes.

## Reconciled release state — 2026-11-15
- Annotated local `v1.4.1` remains at `324532d`; verified ancestor of local `v1.5.0` and main.
- User explicitly chose **“Keep releases local”** on November 15. Local release is complete; external publication is outside this delivery scope.
- Deferred by user choice: GitHub push, Engine Release workflow/attached assets, hosted release notes and publication-result log. These actions were not executed. Original release procedure above remains the future publication procedure, superseded only as a completion requirement for this delivery.
- Notes draft remains local: `../reports/release-notes-v1.4.1.md`. See [local verification](reports/local-release-verification.md).
