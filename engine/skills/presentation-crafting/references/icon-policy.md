# Icon Policy

Use one icon family per template set and per deck.

## Default

Use Phosphor for React-first decks:

- Package: `@phosphor-icons/react`
- Rendering: SVG React components
- Strengths: multiple weights, consistent style, tree-shakable imports, good for interfaces and presentations

## Phosphor Web/Icon Font Mode

Use `@phosphor-icons/web` or a generated Phosphor Pack only when the deck must be standalone HTML without a bundler or when icon-font delivery is explicitly preferred.

Tradeoffs:

- React SVG components give better per-icon control and bundling in React projects.
- Icon fonts can be convenient for static HTML but require font asset handling and can be less precise for accessibility.

## Style Rules

- Do not mix Phosphor, Material Symbols, Lucide, and Font Awesome in one deck.
- Pick one weight per deck, usually `light` or `regular`.
- Use icons as semantic support, not decoration filler.
- Every icon in the content file should have a purpose or label.
- For Phosphor React templates, use any real export from `@phosphor-icons/react` in kebab-case (`chart-line`) or PascalCase (`ChartLine`). The template resolver converts kebab-case to the export name; it does not maintain a legacy alias shim.
- Unknown icon names must fail `validate-slide-content.mjs` with the slide and value named. Preview rendering shows an inline error tile instead of silently substituting a generic icon.

## Material Symbols Exception

Material Symbols are acceptable when the template intentionally follows a Google or product-interface language. Do not use Material as the default for premium or editorial decks.
