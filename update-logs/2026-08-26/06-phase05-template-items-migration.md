# Phase 5 — linear-dark & swiss-modern migrated to unified `items[]` (content.md schema redesign)

Plan: `plans/260826-1000-content-md-schema-redesign/`, phase 05. Commit
`281d996`. Clarity-courseware untouched — it lives downstream
(`AI Udemy Course/`), per revision-2 scope.

## What changed

1. **`linear-dark.template/layouts/react/shared.tsx`** — new exported
   `SlideItem` type (`{title, description?, icon?, column?}`); `items` is now
   `SlideItem[]`; removed flat `icon`/`icons`/`leftItems`/`rightItems` props;
   `LinearList` renders `item.title` + optional `item.description`;
   `flowSteps` gained `icon?: string` (data-flow icons were positionally
   matched to `flowSteps[]`, not `items[]`).
2. **linear-dark consumers** — `text-led-slides.tsx` (two-column filters
   `items` by `column`), `product-workflow-slides.tsx` (process-flow/timeline
   read `item.icon`/`item.title`; before-after filters by `column`),
   `technical-slides.tsx` (architecture nodes + data-flow rows read per-entry
   icons), `data-evidence-slides.tsx` (metric-highlight reads
   `items[0]?.icon`; case-study renders `item.title`/`item.description`/
   `item.icon`), `visual-led-slides.tsx` (image-grid uses `item.title` as
   caption; icon-grid reads `item.icon`/`item.title`), `foundation-slides.tsx`
   (no change needed — `LinearList`-only).
3. **`swiss-modern.template`** — same migration: `SlideItem` in `shared.tsx`,
   `SwissList` object-aware, `text-led`/`product-workflow` two-column
   filtering, case-study/image-grid `item.title`.
4. **Manifests** — both templates bumped to `templateVersion: "2.0.0"` and
   `contentSchemaVersion: "2.0.0"`; this is the actual cutover switch
   (`createDeck` stamps the template's declared value).
5. **`engine/cli/lib/templates.ts`** — `createTemplate` scaffold default
   `contentSchemaVersion` now `"2.0.0"`.
6. **`engine/cli/lib/deck-template-sync.ts`** — `retemplateDeck` refuses a v1
   deck onto a v2 template, naming both versions and the migration path.
7. **Template-authoring skill references** — manifest example → `"2.0.0"`;
   minor-bump rule scoped to "within a content-schema major".

## Why

Phase 5 of the schema redesign: newly created decks on the shipped templates
must consume the v2 canonical `items[]` contract, and the one command that can
push v2 components into a v1 deck (`deck retemplate`) must refuse instead of
silently breaking it.

## Verification

- `tsc --noEmit` clean; CLI tests 57/57.
- Both template manifests pass `validate-template-manifest.mjs`.
- Grep: zero `leftItems`/`rightItems`/`icons?.`/`props.icon` refs remain in
  either template directory.
- Hand-authored v2 fixture decks (one per template, created via
  `aideck new`): both stamped `contentSchemaVersion: "2.0.0"` with no flag →
  template-derived stamping carries the cutover. Live preview verified
  two-column column-filtering, before/after panels, per-item icon tiles
  (icon-grid), and per-step process-flow icons with connectors — screenshots
  in session record. Fixtures deleted after verification.
- `aideck deck retemplate vivimoon-website` → refused (exit 1, both versions
  named); bundle hash byte-identical before/after. It remains the only deck.

## Follow-ups

- Phases 6–7 remain: v1 freeze verification, release cutover. Plus phase-01
  docs follow-up steps (7–9) still unchecked.
