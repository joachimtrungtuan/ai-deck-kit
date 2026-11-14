# `aideck export html --mode single|web`

**What changed**
- Added `--mode single|web` to `aideck export html` and to `export-standalone-html.mjs`. Default stays `single`. Bad, missing, repeated or unknown flag input fails with a usage error; `--mode` with `pdf` is rejected.
- `single`: one self-contained `index.html`. `web`: `index.html` plus an `assets/` folder holding only the files the slides reference (unreferenced assets, `assets/diagrams/` sources and authoring-only folders are not copied). No `.htaccess`/nginx/config files are written.
- Deck plugin (`vite-deck-plugin.ts`, `deck-asset-table.ts`): new `assetDelivery` option. `embedded` maps asset key to data URI (unchanged). `linked` maps key to itself and emits the referenced files into the output via `generateBundle`. The mode reaches `vite.export.config.ts` through `AIDECK_EXPORT_MODE`.
- Export build is now an IIFE (`format: "iife"`, `inlineDynamicImports`, `modulePreload: false`, `cssCodeSplit: false`). New `export-html-assembly.mjs` moves the inlined module script from `<head>` to a classic `<script>` right after `<div id="root"></div>`; `export-standalone-html.mjs` runs it and fails loudly if the page shape is not recognised. Same app script in both modes.
- Tests: `engine/cli/tests/export-mode-flag.test.ts` (flag parsing, assembly, and real single/web exports incl. leftover cleanup when switching mode in one directory). `exportDeck` fixture takes `{ mode, out }`. Added `export-html-assembly.d.mts` so the test typechecks.
- Rebuilt `engine/cli/dist`.

**Why**
- Foundation for progressive web-hosted decks: web mode keeps the page small, with images as ordinary files. The classic in-body script is what a later loader can rely on (no module/import.meta/dynamic import/crossorigin).

**Behaviour change to note**
- `single` no longer copies `assets/` next to `index.html`. Everything it needs is already inside the file, so the copy was dead weight. Nothing in the existing tests relied on it.

**Follow-ups**
- `aideck present` still calls export in single mode; its stale check is mtime-only, so switching modes does not mark an export stale.
- Web `index.html` is still large because fonts are embedded (font work is a later phase). Loader and CSP are not in this change.
- `file://` behaviour of the web output was not checked here (manual check belongs to the verification phase). Over http, the app renders and `assets/*.svg` load.
- Docs still describing the old assets copy or lacking the flag: `SKILL.md` (export section), `references/export-workflow.md`, README; left for the docs phase.
