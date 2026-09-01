# Template Authoring Workflow

Build order and file checklist for a new template set. Mirror an existing set (e.g. `engine/templates/swiss-modern.template/`) structurally at every step.

## Build Order

1. **Catalog decision** — reuse newest `slide-types-vN.md` or create `v(N+1)` (additive copy + new types). Never edit an existing catalog file.
2. **Scaffold** — run `aideck template new <name>`. It creates `templates/<name>.template/` with the CLI-owned starter manifest and files.
3. **Manifest** — complete the generated `template-manifest.json`; keep its name, version axes, and supported types synchronized with the selected catalog.
4. **Schema guidance** — keep the scaffolded `schema-guidance.md`; point agents
   to the manifest, layout contracts, matching React props, and engine schema
   contract. Do not duplicate a mutable field inventory there.
5. **Design system CSS** — template tokens first, then base primitive aliases, then class inventory.
6. **Motion tokens** — map `--deck-motion-base` and `--deck-motion-ease` in the design system; element animation CSS is engine-owned.
7. **Icon policy** — template-specific application of the Phosphor-first rules.
8. **React layouts** — shared helpers, then category files, then `index.ts`.
9. **Specs** — `layout-contracts.md` (per-category layout rules) + `layout-index.json` (complete type→component map).
10. **Validate** — run `aideck template validate <name>`. The bundle stays in `templates/<name>.template/`; nothing is copied into the engine and there is no install step.
11. **Preview + verification** — see `preview-and-verification.md`.
12. **Version** — bump `templateVersion` via `aideck template version <name> --bump patch|minor|major` to match the scale of the change (SKILL.md → Versioning Discipline). Every edit to an existing template ends here; a new template starts at the scaffolded `1.0.0` and needs no bump.

## Manifest Checklist

All keys required (see `template-system-and-versioning.md` for shape):

- `name` (kebab-case id), `displayName`, `deckClass` (template-scoped CSS class)
- `templateVersion`, `contentSchemaVersion`, `slideTypeCatalog`
- `runtime`: `["react", "static-html"]`
- `iconFamily`: `"phosphor-react"`
- `defaultAnimation` (one of the [element-animation catalog](../../../primitives/motion/element-animation-catalog-v1.md) names)
- `supportedAnimations`: supported names from that catalog, including `defaultAnimation`
- `defaultTransition` (optional, one of the [slide transition catalog](../../../primitives/motion/slide-transition-catalog-v1.md) names; omit or `"none"` for a hard cut)
- `designTokens`: flags for color, typography, spacing, grid, radii, stroke, shadow
- `supportedSlideTypes`: COMPLETE list matching the declared catalog — no omissions
- `layoutSource`: `{ "react": "layouts/react", "specs": "layouts/specs" }`
- `qualityRules`: at minimum `oneIdeaPerSlide`, `maxAccentColors`, `cornerRadius`, `iconWeight`, `motionLevel`

## Design System Requirements

Before defining the class inventory, map `engine/primitives/tokens/base-token-contract.md` under the template deck class. Primitive components consume only `--deck-*` aliases; the template keeps ownership of the values and its existing prefixed tokens.

Define as CSS custom properties scoped under the template's deck class (`.{prefix}-deck`):

- **Color**: background, slide surface, panel/card fill, line/border (regular + strong), primary/secondary/tertiary text, accent(s) per `maxAccentColors`, emphasis ink.
- **Typography**: display, body, mono font stacks; respect any user-stated font and max-weight constraints; use `clamp()` for slide-scale type sizes.
- **Spacing**: `--{prefix}-space-1` (8px) through `--{prefix}-space-7` (96px).
- **Grid**: slide width 1600px, height 900px (16:9); 12-column / 8-row frame grid with 64px padding; 6-column under 900px viewport width.
- **Radii / stroke / shadow**: explicit tokens, even when the value is 0.
- **Motion**: `--deck-motion-base` and `--deck-motion-ease`; do not create template-local animation implementations.

Class inventory must cover: deck, slide, frame, kicker, index, title (+ compact variant), section-title, body, number, metric, rule/panel/emphasis-block structure, list, media, meta-row — names prefixed `.{prefix}-`.

## Style Discipline

For icon-bearing layouts, resolve explicit names against the complete supported
Phosphor namespace. A curated fallback may be used only when no icon is
declared; it must never override a valid explicit name. Include a preview
fixture using an icon outside any local curated list and verify that its actual
glyph, not a placeholder, renders.

- Declare the template's signature visual moves (e.g. glow, gradient text, hairline panels) in `layout-contracts.md` and apply them consistently — sparingly, never stacked.
- Accent usage obeys `maxAccentColors`; define WHERE accent may appear.
- No hardcoded colors in TSX; all styling flows through tokens.
- Scope every global style (background, color, font) under the deck class so other templates loaded in the same preview app are unaffected.
