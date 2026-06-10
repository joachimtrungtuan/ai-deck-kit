# 05 — End of Session: linear-dark template

Index/handoff. Full detail in `04-create-linear-dark-template.md`.

## 1. Session goal
Build the 2nd template set `linear-dark` (Linear.app dark, modern-SaaS) for technical/software-requirements decks, per `plans/260610-0831-linear-dark-template/plan.md`: new `slide-types-v2` catalog (v1 + Technical category) + full `linear-dark` implementation, validated and rendering in the shared preview app.

## 2. Completed (DONE)
- **`presentation/templates/slide-types-v2.md`** — v1 verbatim + Technical category (8 types). DONE.
- **`presentation/templates/linear-dark/`** — full set, all 30 v2 types. DONE.
  - `template-manifest.json` (catalog v2, 30 types) — validates.
  - `design-system.css` — dark `--ld-*` tokens scoped under `.ld-deck`; gradient headlines, hairline panels, icon tiles, code/terminal/table styles, `--ld-type: 0.85` typography scale; background = deep-blue spotlight (`--ld-spotlight #2f4cff`) + multiply static grain + quiet line grid.
  - `animation-presets.css` — 8 re-skinned `.ld-anim-*` presets.
  - `icon-policy.md` — Phosphor + `icon`/`icons` prop contract + `ICON_MAP` + placeholder behavior.
  - `layouts/react/` — `shared.tsx` (`LinearSlideProps` superset + icon system), 7 category files, `index.ts`.
  - `layouts/layout-index.json` (30/30), `layouts/specs/layout-contracts.md`.
- **Preview app** — `linear-dark-preview.tsx` (30 demo slides); `main.tsx` reworked into extensible **source registry** (select switches templates, deck-class wrapper, keyboard nav); `preview-shell.css` updated; `@fontsource/inter/700` added. DONE.
- **Verification** — manifest valid · `tsc --noEmit` 0 errors · 30/30 catalog coverage · no font-weight >700 · Inter+JetBrains Mono only · no hardcoded colors in TSX · visually stepped through slides (title/code/icon-grid/architecture), swiss-modern unaffected. DONE.
- **User refinements applied & verified**: text −15% (`--ld-type`); icon placeholders in icon-bearing slots (dashed tile when unset); background grid+spotlight+noise → tuned to deep energetic blue + `background-blend-mode: multiply` (darkens only, no paling) + grid quieted and kept behind content (z-index 0 < frame z-index 1). DONE.
- **Commits on `main`**: `72f84be` feat (template + catalog, 20 files), `597b3be` style (background refinements). DONE.

## 3. In-progress
None. All plan steps complete.

## 4. Key decisions
- New catalog `v2` (additive); swiss-modern stays v1, untouched.
- `LinearSlideProps` is a strict superset of `SwissSlideProps` + optional technical/icon fields — never renamed inherited fields.
- Technical slides split across `technical-slides.tsx` + `technical-table-slides.tsx` to respect ~200-line guidance.
- Spotlight uses a **separate** `--ld-spotlight` deep blue, NOT `--ld-accent` — preserves single-accent discipline on foreground (icons/kickers stay indigo).
- Noise kept **static** (no rAF) per explicit user instruction, despite the reference animating it.
- Preview app generalized to a source registry rather than a one-off toggle, so future templates/decks add as one entry.

## 5. Files touched
Created: `slide-types-v2.md`; all of `templates/linear-dark/**`; `preview-app/src/linear-dark-preview.tsx`; logs `04-…` and this `05-…`.
Modified: `preview-app/src/main.tsx`, `preview-app/src/preview-shell.css`.
Not committed (baseline): rest of untracked workspace files (repo had no prior commits; intentionally kept commits focused on linear-dark only).

## 6. Unresolved questions / blockers
- Technical category fixed at 8 types — confirm none to add/remove (`sequence-diagram`, `database-schema`?).
- `ICON_MAP` is 17 curated names — extend in `shared.tsx` as decks need.
- Open design call: keep spotlight as distinct deep-blue token, or repoint `--ld-accent` itself to the energetic blue (would shift all foreground accents)? Awaiting user.
- Static-HTML export path not yet exercised for the new technical slides.

## 7. Pickup pointer
Template is ready to use. Next session: either (a) resolve the accent-vs-spotlight color question above, or (b) build a real deck with `presentation-crafting` using `slideTypeCatalog: v2` / `linear-dark` to exercise the technical slide types end-to-end. Preview: `cd presentation && npm run dev` → :5173 → switch source to "Linear Dark".
