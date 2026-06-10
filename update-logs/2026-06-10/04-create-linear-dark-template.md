# 04 — Create `linear-dark` Template Set (catalog v2)

## What changed

Built the 2nd presentation template set, `linear-dark` (Linear.app-inspired, dark, modern-SaaS), purpose-built for technical / software-requirements decks. Two deliverables per the plan at `plans/260610-0831-linear-dark-template/plan.md`:

1. **New slide-type catalog `slide-types-v2.md`** — v1 verbatim + new **Technical** category (8 types): `code-snippet`, `terminal-output`, `architecture-overview`, `data-flow`, `api-endpoint`, `spec-table`, `comparison-table`, `decision-record`. Additive; swiss-modern stays on v1 untouched.
2. **`linear-dark` template set** implementing all 30 v2 types.

### Files created
- `presentation/templates/slide-types-v2.md` — catalog (v1 + Technical).
- `presentation/templates/linear-dark/template-manifest.json` — declares `slideTypeCatalog: v2`, 30 supported types; validates.
- `presentation/templates/linear-dark/design-system.css` — dark token system (`--ld-*`), all global styles scoped under `.ld-deck` / `.ld-slide`; gradient headlines, hairline panels, blue spotlight + line-grid + static-noise texture, icon tiles, code/terminal/table styles. Single `--ld-type` knob scales all typography.
- `presentation/templates/linear-dark/animation-presets.css` — same 8-preset vocabulary, re-skinned (`.ld-anim-*`, softer ease, restrained timings), spotlight glow-pulse.
- `presentation/templates/linear-dark/icon-policy.md` — Phosphor regular; documents the `icon`/`icons` prop contract + curated `ICON_MAP` + placeholder behavior.
- `presentation/templates/linear-dark/layouts/react/` — `shared.tsx` (`LinearSlideProps` superset of `SwissSlideProps` + technical fields + icon system), `foundation/text-led/visual-led/data-evidence/product-workflow/technical/technical-table` category files, `index.ts`. All 30 `Linear*Slide` components.
- `presentation/templates/linear-dark/layouts/layout-index.json` — 30/30 type→component map.
- `presentation/templates/linear-dark/layouts/specs/layout-contracts.md` — per-type dark/panel layout rules.
- `presentation/preview-app/src/linear-dark-preview.tsx` — 30 demo slides (realtime-sync-engine sample content), icons wired.

### Files modified
- `presentation/preview-app/src/main.tsx` — replaced hardcoded single-template render with an extensible **source registry** (`SOURCES[]`): a top-bar select switches preview sources, deck class wraps the stage, keyboard nav preserved. Added `@fontsource/inter/700` + linear-dark CSS imports.
- `presentation/preview-app/src/preview-shell.css` — `.ld-slide` stage sizing/shadow parity, `.preview-deck`, `.preview-source-switch` styles.

## Why
Second template per the plan; enables technical decks the typography-only swiss set can't carry (code, APIs, specs, architecture). Source registry added because the preview app previously rendered only swiss-modern — now scales to N templates (and decks later).

## Verification (all pass)
- Manifest validator: valid.
- `npx tsc --noEmit`: 0 errors.
- Catalog coverage: layout-index 30 == manifest 30, no gaps.
- `font-weight`/`fontWeight`: none > 700. Fonts: Inter + JetBrains Mono only.
- No hardcoded colors in TSX (all via `--ld-*`).
- Visual: stepped through slides at 1600×900 in preview; title/code/icon-grid/architecture render correctly, switcher works, swiss-modern unaffected.

## User-requested refinements (this session)
- Background texture added: blue spotlight + fine line grid + **static** noise, gentle long spotlight falloff.
- All typography reduced ~15% via `--ld-type: 0.85` (reads smaller on large screens).
- Icon system added with visible **dashed placeholder** tiles in icon-bearing slots (`icon-grid`, `process-flow`, `case-study`, `timeline`, `architecture-overview`, `metric-highlight`) so authoring agents know where icons belong.

## Follow-ups / unresolved
- Technical category fixed at 8 types — confirm none to add/remove (e.g. `sequence-diagram`, `database-schema`).
- `ICON_MAP` is a curated 17-name set; extend in `shared.tsx` as decks need more.
- Static-HTML export path not yet exercised for the new technical slides.
