import { resolve } from "node:path";
import { loadTemplateDefinition, renderComponentImports, renderFontImports, renderTemplateStyleImports, type TemplateDefinition } from "./template-definition-loading.ts";

/** One resolvable template, as the CLI resolved it. The preview never resolves templates itself. */
export type GalleryEntry = { name: string; root: string; origin: string };

/**
 * Preview slides for one template. Component names and the props binding are both parameterised
 * because the gallery renders several templates in one module, where each owns its own fixtures.
 */
function templateSlideEntries(definition: TemplateDefinition, alias: (component: string) => string = (name) => name, propsBinding = "previewProps"): string[] {
  const { manifest } = definition;
  return manifest.supportedSlideTypes.flatMap((type) => {
    const entry = definition.layouts[type];
    const variants = manifest.layoutVariants?.[type];
    if (!variants?.length) {
      return [`{ type: ${JSON.stringify(type)}, Component: ${alias(entry.component)}, props: ${propsBinding} }`];
    }
    return variants.map((variant) => (
      `{ id: ${JSON.stringify(templatePreviewSlideId(type, variant))}, type: ${JSON.stringify(`${type} · ${variant}`)}, Component: ${alias(entry.component)}, props: { ...${propsBinding}, layoutVariant: ${JSON.stringify(variant)} } }`
    ));
  });
}

/**
 * The gallery is exactly the set of templates the CLI could resolve for this project — shipped
 * defaults and the user's own, with the user's winning. Nothing here is hardcoded per template.
 */
export function loadGallerySource(gallery: GalleryEntry[], watchedFiles: Set<string>): string {
  const imports: string[] = [];
  const declarations: string[] = [];
  const entries: string[] = [];
  gallery.forEach((entry, index) => {
    let definition: TemplateDefinition;
    try {
      definition = loadTemplateDefinition(resolve(entry.root), watchedFiles);
    } catch {
      return; // A broken bundle is `template validate`'s business; it must not blank the gallery.
    }
    // Two templates may export the same component name, so every import is aliased per template.
    const alias = (component: string) => `g${index}_${component}`;
    definition.imports.forEach((names, source) => {
      imports.push(`import { ${[...names].map((name) => `${name} as ${alias(name)}`).join(", ")} } from ${JSON.stringify(source)};`);
    });
    imports.push(...renderFontImports(definition));
    imports.push(...renderTemplateStyleImports(definition));
    // Fixtures are per template for the same reason components are: one template's extra props must
    // never leak into another's preview.
    const propsBinding = `g${index}_previewProps`;
    declarations.push(`const ${propsBinding} = ${JSON.stringify(definition.previewProps)};`);
    entries.push(`{ id: ${JSON.stringify(definition.manifest.name)}, label: ${JSON.stringify(definition.manifest.displayName)}, origin: ${JSON.stringify(entry.origin)}, deckClass: ${JSON.stringify(definition.deckClass)}, slides: [${templateSlideEntries(definition, alias, propsBinding).join(",\n")}], defaultTransition: ${JSON.stringify(definition.manifest.defaultTransition ?? "none")} }`);
  });
  return `${imports.join("\n")}
${declarations.join("\n")}
export const runtimeGallery = [${entries.join(",\n")}];`;
}

export function loadTemplateSource(root: string, watchedFiles: Set<string>): string {
  const definition = loadTemplateDefinition(root, watchedFiles);
  const { manifest } = definition;
  const slides = templateSlideEntries(definition);
  const componentImports = renderComponentImports(definition.imports);

  return `${componentImports.join("\n")}
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
const previewProps = ${JSON.stringify(definition.previewProps)};
export const runtimeDeck = null;
export const deckAssets = {};
export const runtimeTemplate = {
  id: ${JSON.stringify(manifest.name)},
  label: ${JSON.stringify(manifest.displayName)},
  deckClass: ${JSON.stringify(definition.deckClass)},
  slides: [${slides.join(",\n")}],
  defaultTransition: ${JSON.stringify(manifest.defaultTransition ?? "none")},
};`;
}

export function templatePreviewSlideId(type: string, variant: string): string {
  return JSON.stringify([type, variant]);
}
