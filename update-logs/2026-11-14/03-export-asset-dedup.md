# Export asset de-duplication

**What:** Standalone HTML export now embeds each rendered image once. The Vite plugin builds a shared `deckAssets` table (data URIs) from slide render props only; slides keep plain `assets/` paths and `resolveSlideAssets` swaps them at the two render sites. Authoring-only `assets:` lists are no longer embedded. Missing, escaping and unsupported paths still fail the build; a symlink in `assets/` that resolves outside the deck now fails too.

**Why:** Marusei deck exported at 29.5 MB because every use of an image was a full copy.

**Result:** Marusei 29.5 MB -> 15.8 MB, 41 duplicated assets -> 0, PDF pages unchanged. Tests: `export-asset-dedup.test.ts` (resolver units, real build, symlink), `serve.test.ts` updated.

**Follow-ups:** release 1.4.1 (version bump, changelog, tag) not done on this branch. Size still 0.8 MB over the 15 MB soft target.
