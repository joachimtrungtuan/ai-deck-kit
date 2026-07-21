# Preview Registration And Verification

How to register a new template set in the shared preview runtime and the gates it must pass. The shared app rules live in `presentation-crafting/references/preview-runtime.md` — never scaffold a per-template app.

## Registration Steps

1. **Preview data file** — create `engine/preview-app/src/{template-name}-preview.tsx`:
   - Import all slide components from `../../templates/{template-name}/layouts/react`.
   - Export `{templateName}Slides: PreviewSlide[]` — one entry per slide type, in catalog order: `{ type, Component, props }` with realistic demo props matching the template's target domain.
2. **main.tsx** — smallest possible diff:
   - Import the template's `design-system.css` and `animation-presets.css`.
   - Import the preview data file.
   - Extend the template switcher (or add one if only one template exists) so the user can select between registered slide sets; wrap rendered slides in the active template's deck class.
   - Keep keyboard navigation (arrow left/right) working.
3. **Fonts** — load any template fonts via `@fontsource` imports in main.tsx; check `presentation/package.json` before adding dependencies (Inter and JetBrains Mono are already present).

## Verification Gates (all must pass before handoff)

1. **Manifest**: `node engine/skills/presentation-template-creation/scripts/validate-template-manifest.mjs engine/templates/{template-name}/template-manifest.json`
2. **Types compile**: `cd presentation && npx tsc --noEmit` — zero errors.
3. **Visual pass**: `npm run dev`, switch to the new template, step through EVERY slide type: renders, no clipped text at 1600x900, animations fire once per slide entry, existing templates still render unaffected.
4. **Catalog coverage**: every type ID in the declared `slide-types-vN.md` exists in `layout-index.json`, the manifest's `supportedSlideTypes`, and the preview slide list.
5. **Token discipline**: no hardcoded colors in TSX (grep for `#` hex values outside CSS); accent usage follows the template's declared policy.
6. **Constraint audits**: grep `font-weight` (respect declared max), `font-family` / `@fontsource` (only declared fonts), and confirm all class names carry the template prefix.

## After Verification

- Record the change in `update-logs/` (what changed, why, follow-ups).
- Report per skill reporting format; list unresolved questions at the end.
