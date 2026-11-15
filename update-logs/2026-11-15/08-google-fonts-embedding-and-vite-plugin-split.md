# Google Fonts embedding gap + vite-deck-plugin split

Follow-ups from `07-codebase-review-progressive-export-fixes.md`, chosen by the user.

**What changed**
- **Export HTML parsing** (`collectOverrideCss`, `moveAppScriptIntoBody`): reviewed, no defect. A missed style hash is caught by the headless CSP check, so tightening the regexes was skipped as low value.
- **Google Fonts embedding**:
  - `export-google-fonts-embed.mjs`: new `embedGoogleFontsInStyleBlocks(html, options)`, used by `export-standalone-html.mjs`. Replacers are now functions, so `$` sequences in CSS are not read as replacement patterns.
  - `validate-slide-content.mjs`: rejects a deck `override.css` that references `fonts.googleapis.com` / `fonts.gstatic.com`. Fonts belong in the template manifest `fonts`, which export embeds.
  - Typing in `export-google-fonts-embed.d.mts`; 2 new tests in `export-google-fonts-embed.test.ts`; rule documented in `docs/deck-format-spec.md`.
- **`vite-deck-plugin.ts` split** (538 → ~250 lines, no behavior change):
  - `slide-yaml-block-editing.ts`: slide YAML read/replace, content revision, JSON body/response helpers.
  - `template-definition-loading.ts`: template manifest, preview props, font/style/component import rendering.
  - `template-preview-source.ts`: gallery + single-template preview sources, `templatePreviewSlideId`.
  - The plugin re-exports `readSlideYamlBlock`, `replaceSlideYamlBlock`, `templatePreviewSlideId`, `GalleryEntry` so importers are unchanged.
  - The repeated `deckAssets` expression in `loadDeckSource` is now one local.

**Why**: user picked these follow-ups after the review round.

**Verification**: typecheck + focused tests (`serve`, `export-google-fonts-embed`) pass; full gates pass (234 tests, build:check, lint, typecheck, validate).

**Follow-ups**: none.
