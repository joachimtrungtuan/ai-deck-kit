# Fix: `assets/` image references never resolved in preview/export

**What changed.** `engine/preview-app/vite-deck-plugin.ts` now runs `content.md` through a new
`inlineDeckAssets()` step before handing it to `createManifestDeckSource()`. It regex-matches any
quoted `assets/<relPath>` string (the documented convention in `docs/deck-format-spec.md` for
`imageSrc` etc.), reads the file from the deck's `assets/` folder, and rewrites the reference to a
base64 `data:` URI inline. Path-traversal is rejected (`assets/../../etc/passwd` throws), missing
files throw with a clear message, unsupported extensions throw. Runs identically for `aideck serve`
(dev) and `aideck export` (build) since both share the same plugin instance.

**Why.** `imageSrc: "assets/diagram.png"` is the spec'd, documented way to reference deck assets so
they travel with the portable `.deck` bundle. Nothing in the Vite pipeline ever resolved that path —
Vite's asset pipeline only rewrites `import`/`new URL(...)` statements, not runtime JSX attribute
strings, and there was no dev-server route or export-time asset copy for it either. Confirmed
empirically against a real, currently-broken external deck
(`.../claude-for-marketers/slides/decks/claude-lesson-1-5.deck`): `imageSrc` refs using
`assets/*.png` were broken; refs already using hand-rolled `data:image/svg+xml;base64,...` worked.
The authoring agent followed the documented convention correctly — this was an engine bug, not an
authoring mistake.

**Tests.** Added 3 cases to `engine/cli/tests/serve.test.ts` covering: base64 inlining of a valid
`assets/*` reference, path-traversal rejection, and missing-file error. `npm run test:serve` — 29/29
pass. `npm run typecheck` clean.

**Version bump.** Patch bump 0.3.0 → 0.3.1 in `package.json`, `engine/package.json`,
`engine/engine.version.json`, `ai-deck-kit.json` (bug fix, no API/contract change).

**Follow-ups / known limitation.** The `generatedSource`/`.build/source/*.tsx` pre-generated deck
branch in `loadDeckSource()` is NOT covered by this fix — no real deck currently exercises that path,
so it was left out of scope. If a deck ever ships pre-generated `.tsx` slide sources with `assets/`
references, those will still be broken.
