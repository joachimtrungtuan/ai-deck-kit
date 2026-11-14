# Export asset de-duplication

**What:** Standalone HTML export now embeds each rendered image once. The Vite plugin builds a shared `deckAssets` table (data URIs) from slide render props only; slides keep plain `assets/` paths and `resolveSlideAssets` swaps them at the two render sites. Authoring-only `assets:` lists are no longer embedded. Missing, escaping and unsupported paths still fail the build; a symlink in `assets/` that resolves outside the deck now fails too.

**Why:** Marusei deck exported at 29.5 MB because every use of an image was a full copy.

**Result:** Marusei 29.5 MB -> 15.8 MB, 41 duplicated assets -> 0, PDF pages unchanged. Tests: `export-asset-dedup.test.ts` (resolver units, real build, symlink), `serve.test.ts` updated.

**Follow-ups:** release 1.4.1 (version bump, changelog, tag) not done on this branch. Size still 0.8 MB over the 15 MB soft target.

## Review follow-up

- **Invalid-YAML fences no longer lose images.** The legacy v1 parser still renders `imageSrc` from a fence that is not valid YAML (duplicate key, `kicker: @foo`). The collector now falls back to scanning that fence's `key: value` lines (skipping authoring-only keys), so those assets enter the table instead of exporting as a broken `assets/...` path. It never throws, so previously working v1 decks keep building.
- **Whole-string asset match rejects whitespace.** Prose such as `body: assets/ is where images live` is no longer read as a path; a bare `assets/` is not one either. Resolver and table share the same patterns.
- **One `isWithin`.** Exported from `deck-asset-table.ts` and imported by `vite-deck-plugin.ts`.
- **Tests:** resolver run against a table from `collectDeckAssetTable` for nested shapes; built output asserted to map the path to its data URI; real v1 and v2 export builds; regressions for the invalid-YAML fence and the prose case. Shared build helpers live in `engine/cli/tests/export-deck-fixture.ts`.
- Collecting from every non-authoring YAML key (not only known layout props) was kept on purpose: extra collection is harmless, and filtering to known props risks missing a rendered one.
