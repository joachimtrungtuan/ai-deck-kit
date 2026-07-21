# Phase 02: `.deck` Format + VIVIMOON Migration + Validators

## What changed

- Added `engine/schemas/deck-manifest.schema.json`: JSON Schema (draft-07) for `deck.json` per `docs/deck-format-spec.md` §3 — validates `schema`, `title`, `slug`, `audience`, `goal`, `template.{set,version}`, `slideTypeCatalog`, `blockCatalog`, `contentSchemaVersion`, `outputMode`, `status`, `defaults.{animation,transition}`, and the `slides[]` registry.
- Added `engine/skills/presentation-crafting/scripts/migrate-slides-to-deck.mjs`: converts a legacy `content/{slug}.slides.md` (frontmatter + per-slide YAML) into a split `deck.json` + `content.md` pair, and moves `source/` → `.build/source/`, `export/` → `.build/export/`.
- Migrated `decks/vivimoon-website.deck/` with the converter: 12 slides registered, `deck.json` generated (`template: linear-dark@1.0.0`), `content.md` generated, old `content/` dir removed, `source/`/`export/` moved under `.build/`.
- Rewrote `engine/skills/presentation-crafting/scripts/validate-slide-content.mjs` to take a `.deck` directory (not a single content file): reads `deck.json` + `content.md` together, checks required manifest fields, checks `template.set` resolves to an installed `engine/templates/<set>/template-manifest.json`, checks manifest↔content slide-id parity in both directions, enforces per-slide required YAML fields, enforces `override.reason` non-empty when `override.layout`/`override.animation` is active, does a permissive block-catalog presence check (Phase 03's actual catalog doesn't exist yet), and checks the three required prose subsections (`### On-Slide Text`, `### Visual Direction`, `### Speaker Notes`).
- Updated all downstream path references from `source/`/`export/` to `.build/source/`/`.build/export/`: `engine/vite.export.config.ts`, `export-standalone-html.mjs`, `export-pdf.mjs`, `engine/preview-app/src/deck-registry.tsx`, `decks/vivimoon-website.deck/.build/source/vivimoon-website-deck.tsx` (own relative import, one more `../` since it's nested one level deeper), `engine/preview-app/src/main.tsx`.
- Updated skill docs to match: `SKILL.md` (steps 4, 7, folder-structure diagram, validator invocation, scripts description), `references/content-normalization-workflow.md`, `references/export-workflow.md` (4 stale path refs).

## Why

Phase 02 of `plans/260722-0258-ai-deck-kit-restructure/`: introduce the `.deck` bundle format (manifest + content split) and prove it round-trips on the one real deck in the repo, with a validator that actually checks the new shape instead of the old single-file schema.

## Scope decision

`docs/deck-format-spec.md` §9 describes `.template` bundles embedded into decks (a `template/` folder snapshot inside each `.deck`). Phase 02's own Related Code Files / Success Criteria never list this — so it's deferred to whichever later phase actually owns template packaging, per the phase file's narrower scope rather than the full spec.

## Verification

- `node engine/skills/presentation-crafting/scripts/validate-slide-content.mjs decks/vivimoon-website.deck` → passes.
- Standalone HTML export re-run against the new `.build/export/` path → succeeds, single inlined file.
- PDF export re-run against the new `.build/export/` path → succeeds; `pdfinfo` confirms 12 pages (matches 12 slides), 800×450pt (16:9), not encrypted.
- This is a full re-verification against the post-migration layout (the Phase 01 regression check was run before the `source/`→`.build/source/`, `export/`→`.build/export/` move; nothing from that check carries over automatically).

## Follow-ups

None outstanding. Proceeding to Phase 03 (design-primitives layer: blocks, motion/morph, tokens).
