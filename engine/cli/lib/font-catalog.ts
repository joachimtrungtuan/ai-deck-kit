// The typefaces a template is allowed to ask for.
//
// A template declares families by key in its manifest (`fonts: ["fraunces"]`) and the preview
// runtime imports exactly those stylesheets. This exists so that choosing a typeface is never a
// reason to edit the engine: the packages below are already installed by every workspace.
//
// The list is closed on purpose. Each entry costs an npm dependency in engine/package.json, so
// adding a family is engine work — it happens in the kit's own repository and reaches installed
// projects through `aideck upgrade`. A template that needs a family absent here must be reported,
// not worked around.

/** Family key → the stylesheet specifiers preview and export import for it. */
export const FONT_CATALOG: Record<string, string[]> = {
  // Already carried by the preview shell; listed so a template can name what it actually uses.
  inter: ["@fontsource/inter/300.css", "@fontsource/inter/400.css", "@fontsource/inter/500.css", "@fontsource/inter/600.css", "@fontsource/inter/700.css"],
  "jetbrains-mono": ["@fontsource/jetbrains-mono/400.css", "@fontsource/jetbrains-mono/500.css"],
  newsreader: ["@fontsource-variable/newsreader/wght.css", "@fontsource-variable/newsreader/wght-italic.css"],
  // Variable builds: one file per subset covers every weight in the family.
  "dm-sans": ["@fontsource-variable/dm-sans/wght.css", "@fontsource-variable/dm-sans/wght-italic.css"],
  figtree: ["@fontsource-variable/figtree/wght.css", "@fontsource-variable/figtree/wght-italic.css"],
  fraunces: ["@fontsource-variable/fraunces/wght.css", "@fontsource-variable/fraunces/wght-italic.css"],
  lora: ["@fontsource-variable/lora/wght.css", "@fontsource-variable/lora/wght-italic.css"],
  manrope: ["@fontsource-variable/manrope/wght.css"],
  "plus-jakarta-sans": ["@fontsource-variable/plus-jakarta-sans/wght.css", "@fontsource-variable/plus-jakarta-sans/wght-italic.css"],
  "source-serif-4": ["@fontsource-variable/source-serif-4/wght.css", "@fontsource-variable/source-serif-4/wght-italic.css"],
  "space-grotesk": ["@fontsource-variable/space-grotesk/wght.css"],
  "work-sans": ["@fontsource-variable/work-sans/wght.css", "@fontsource-variable/work-sans/wght-italic.css"],
};

export function fontCatalogNames(): string[] {
  return Object.keys(FONT_CATALOG).sort();
}

/** Families a template declared that the engine cannot supply. Empty means the declaration is usable. */
export function unknownFontFamilies(fonts: readonly string[]): string[] {
  return fonts.filter((family) => !(family in FONT_CATALOG));
}

/**
 * Stylesheet specifiers for a template's declared families, deduplicated and stable.
 * Throws on an unknown family so a typo fails at preview time instead of silently losing the font.
 */
export function resolveFontImports(fonts: readonly string[] = []): string[] {
  const unknown = unknownFontFamilies(fonts);
  if (unknown.length) {
    throw new Error(`Unknown font ${unknown.length === 1 ? "family" : "families"}: ${unknown.join(", ")}. The engine ships: ${fontCatalogNames().join(", ")}.`);
  }
  return [...new Set(fonts.flatMap((family) => FONT_CATALOG[family]))];
}
