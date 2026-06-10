# React Layout Conventions

Structural rules for a template set's `layouts/react/` directory. Mirror `swiss-modern/layouts/react/` exactly in organization; only the visual language changes.

## File Organization

One file per slide category, plus shared helpers and a barrel export:

```text
layouts/react/
├── index.ts                     (re-export everything)
├── shared.tsx                   (props type + shared helper components)
├── foundation-slides.tsx        (title, section-divider, closing, agenda)
├── text-led-slides.tsx          (text-statement, text-list, two-column-text, quote, numbered-framework)
├── visual-led-slides.tsx        (full-bleed-image, image-text-split, image-grid, icon-grid, diagram)
├── data-evidence-slides.tsx     (metric-highlight, chart, evidence-stack, case-study)
├── product-workflow-slides.tsx  (process-flow, before-after, ui-showcase, timeline)
└── {extra-category}-slides.tsx  (one file per new catalog category; split if >200 lines)
```

## Component Naming

`{Prefix}{SlideName}Slide` — e.g. `LinearTitleSlide`, `SwissMetricHighlightSlide`. Prefix is unique per template set and matches the CSS prefix.

## Props Contract (CRITICAL)

- Each template exports one props type: `{Prefix}SlideProps`.
- It MUST be a superset of the existing shared prop shape (see `SwissSlideProps` in `swiss-modern/layouts/react/shared.tsx`): keep every inherited field with identical name and type.
- New slide types add OPTIONAL fields only. Never rename or repurpose an inherited field — the canonical content schema and preview runtime depend on field stability.
- `children` remains the slot for custom markup (diagrams, charts).
- When fields are added, bump the template's `contentSchemaVersion` minor version.

## Shared Helpers

Provide template-skinned equivalents of the standard helper set in `shared.tsx`:

- `{Prefix}Frame({ children, animation })` — grid container wrapping all slide content; applies the animation class.
- `{Prefix}TextBlock({ kicker, title, body })` — reusable heading block.
- `{Prefix}List({ items })` — indexed list, no browser bullets.
- `{Prefix}Media({ imageSrc, imageAlt, caption })` — image figure with the template's media treatment.
- `{Prefix}SmallLabel({ children })` — kicker/metadata text.
- Additional helpers as the style demands (e.g. a panel/card component) — keep them in `shared.tsx`.

## Layout Index

`layouts/layout-index.json` maps EVERY slide type in the declared catalog:

```json
{
  "title": { "component": "{Prefix}TitleSlide", "source": "react/foundation-slides.tsx" }
}
```

Completeness is a verification gate — cross-check against the catalog file before handoff.

## Layout Contracts Doc

`layouts/specs/layout-contracts.md` documents, per category: grid placement, typography roles, the template's signature moves, and what is forbidden (e.g. decorative grid textures, off-token colors). Same document structure as swiss-modern's.
