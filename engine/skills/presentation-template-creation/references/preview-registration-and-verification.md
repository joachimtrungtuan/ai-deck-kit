# Preview Registration And Verification

How to register a new template set in the shared preview runtime and the gates it must pass. The shared app rules live in `presentation-crafting/references/preview-runtime.md` — never scaffold a per-template app.

## Preview During Authoring

Run `aideck serve --template {template-name}` from the workspace. The command opens the shared browser preview and prefers `templates/{template-name}.template/` over an installed template with the same name. Use `--no-open` in automation.

The draft must contain a valid manifest, `design-system.css`, `animation-presets.css`, `layouts/layout-index.json`, and a component source for every declared supported slide type. The browser is review-only; edit the template source through the agent workflow and rely on live reload.

## Registration Steps

1. **Install** — run `aideck template register {template-name}` after the user draft passes validation.
2. **Curated gallery data** — for templates shipped with the engine, create `engine/preview-app/src/{template-name}-preview.tsx`:
   - Import all slide components from `../../templates/{template-name}.template/layouts/react`.
   - Export `{templateName}Slides: PreviewSlide[]` — one entry per slide type, in catalog order: `{ type, Component, props }` with realistic demo props matching the template's target domain.
3. **Gallery registration** — make the smallest possible runtime diff:
   - Import the template's `design-system.css` and `animation-presets.css`.
   - Import the preview data file.
   - Extend the template switcher (or add one if only one template exists) so the user can select between registered slide sets; wrap rendered slides in the active template's deck class.
   - Keep keyboard navigation (arrow left/right) working.
4. **Fonts** — load any template fonts via `@fontsource` imports in `engine/preview-app/src/main.tsx`; check `engine/package.json` before adding dependencies (Inter and JetBrains Mono are already present).

## Verification Gates (all must pass before handoff)

1. **Manifest and install**: `aideck template register {template-name}` completes without errors.
2. **Types compile**: `cd engine && npx tsc --noEmit --project tsconfig.storybook.json` — zero errors.
3. **Visual pass**: run `aideck serve --template {template-name}`, step through EVERY slide type, and confirm it renders without clipping at 1600x900. For a shipped template, also run bare `aideck serve` and confirm the curated gallery entry and existing templates remain unaffected.
4. **Catalog coverage**: every type ID in the declared `slide-types-vN.md` exists in `layout-index.json`, the manifest's `supportedSlideTypes`, and the preview slide list.
5. **Token discipline**: no hardcoded colors in TSX (grep for `#` hex values outside CSS); accent usage follows the template's declared policy.
6. **Constraint audits**: grep `font-weight` (respect declared max), `font-family` / `@fontsource` (only declared fonts), and confirm all class names carry the template prefix.

## After Verification

- Record the change in `update-logs/` (what changed, why, follow-ups).
- Report per skill reporting format; list unresolved questions at the end.
