# Slide address in Agentation annotations

**What:** Named each slide in the DOM so an annotation's forensic output says which slide it belongs to, and scoped Agentation's annotation bucket per deck. Follow-up to `2026-08-10/03-annotation-addressing-investigation.md`.

**Why:** Annotations pasted to an agent carried no slide identity — with 25 slides, a comment on slide 1 was indistinguishable from slide 2.

**Changes:**
- `engine/preview-app/src/fixed-slide-canvas.tsx` — slide wrapper now carries `id` (`slide-03-muc-tieu-kinh-doanh`) plus `data-slide-index`, `data-slide-type`, `data-layout-variant`, `data-template`. New `slideIndex` prop; `slideDomId()` mirrors the sidebar label (`NN` + slide **type**) and skips the ordinal when the type already opens with it (`01-mo-dau` → `slide-01-mo-dau`, not `slide-01-01-mo-dau`). Type, not id, because a manifest-built deck's ids are bare ordinals (`slide-01`) that add nothing to the index — only the generated `.build/source/*-deck.tsx` path carries descriptive types. All attributes gated behind `mountAgentation`, so `deck-export.tsx` output is byte-identical.
- `engine/preview-app/src/preview-types.ts`, `manifest-deck-source.tsx` — `layoutVariant` carried on `PreviewSlide` to feed `data-layout-variant`.
- `engine/preview-app/src/iframe-agentation-entry.tsx` — patches `Storage.prototype` in the iframe realm to suffix `feedback-annotations*` keys with the deck slug (handed over as `window.__aideckDeckSlug`). Fixes cross-deck annotation bleed on a shared preview origin. Toolbar preference keys deliberately left unscoped so a chosen output mode survives a deck switch.

**Verified live** (`vivimoon-website`, port 5183): slug reaches the frame; wrapper renders `id="slide-01-mo-dau"` / `slide-03-muc-tieu-kinh-doanh` with the ordinal dedupe working; DOM path from `body` reads `body > div#slide-03-muc-tieu-kinh-doanh > section > div > header > h1`; storage probe writes `feedback-annotations-blank--vivimoon-website` while `feedback-toolbar-settings` stays global and non-`feedback` keys are untouched. `npm run typecheck` clean; 44/44 CLI tests pass.

**Notes / follow-ups:**
- The address surfaces in **Forensic** output only — that mode is the one that prints `**Full DOM Path:**`. Standard/Detailed print the short `elementPath`, which never reaches an ancestor id. This is by user decision; Forensic is the intended default.
- No `.deck` / `.template` format change and no migration: the wrapper is engine-created and `slides[].id`/`type` already exist in every manifest. Installed projects get this on engine upgrade.
- Still open: within one deck, annotations from all slides share a bucket and render on every slide, because Agentation mounts once per deck and only the portal children swap. Per-slide scoping needs an Agentation remount on slide change — larger, not attempted.
- Fixed a pre-existing `aideck verify` failure while here: `vivimoon-website.deck` sat at `linear-dark@1.0.0` with no `origin` recorded and no frozen `template/` snapshot on disk, against a shipped template now at 1.1.0. Ran `aideck deck retemplate vivimoon-website` (all 12 slide types supported, catalogs already `v2`/`v1`, no content rewritten). `aideck verify` now exits 0. The deck is gitignored user data, so this touches no committed file.
- Console shows two React `createRoot()` on an already-rooted container warnings in the preview. Verified against a stashed baseline — pre-existing, unrelated to this change.
