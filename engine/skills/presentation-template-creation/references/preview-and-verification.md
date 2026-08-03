# Preview And Verification

How to review a template set in the shared preview runtime and the gates it must pass. The shared app rules live in `presentation-crafting/references/preview-runtime.md` — never scaffold a per-template app.

## Preview During Authoring

Run `aideck serve --template {template-name}` from the workspace. The command prints exactly what it resolved — name, origin (`project` or `shipped`), version, and absolute path — before Vite starts, so you can confirm you are looking at the template you think you are. Use `--no-open` in automation.

A project template always wins over a shipped default of the same name. If the template cannot be resolved, `serve` fails and names both places it looked; it never quietly falls back to a different template.

The template must contain a valid manifest, `design-system.css`, `animation-presets.css`, `layouts/layout-index.json`, and a component source for every declared supported slide type. The browser is review-only; edit the template source through the agent workflow and rely on live reload.

## Gallery

There is no registration step and no per-template preview file. Bare `aideck serve` builds the gallery by resolving every template the project can see, so a new bundle in `templates/` appears as soon as it validates. A template that fails to resolve is left out of the gallery rather than breaking it.

Fonts are the one runtime touchpoint: load any template fonts via `@fontsource` imports in `engine/preview-app/src/main.tsx`, and check `engine/package.json` before adding dependencies (Inter, JetBrains Mono, and Newsreader are already present).

## Verification Gates (all must pass before handoff)

1. **Manifest**: `aideck template validate {template-name}` completes without errors and reports the origin and path you expect.
2. **Types compile**: `cd engine && npx tsc --noEmit --project tsconfig.storybook.json` — zero errors.
3. **Visual pass**: run `aideck serve --template {template-name}`, step through EVERY slide type, and confirm it renders without clipping at 1600x900. Then run bare `aideck serve` and confirm the template appears in the gallery and the others still render correctly.
4. **Catalog coverage**: every type ID in the declared `slide-types-vN.md` exists in `layout-index.json` and the manifest's `supportedSlideTypes`.
5. **Token discipline**: no hardcoded colors in TSX (grep for `#` hex values outside CSS); accent usage follows the template's declared policy.
6. **Constraint audits**: grep `font-weight` (respect declared max), `font-family` / `@fontsource` (only declared fonts), and confirm all class names carry the template prefix.
7. **Version bumped**: `aideck template version {template-name}` shows a higher version than before the edit, at the level the change earned (see SKILL.md → Versioning Discipline).
8. **Downstream decks named**: `aideck deck status` run, and any deck now `behind` reported to the user.

## After Verification

- Record the change in `update-logs/` (what changed, why, follow-ups).
- Report per skill reporting format; list unresolved questions at the end.
