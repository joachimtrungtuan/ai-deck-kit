import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { Plugin } from "vite";

const virtualId = "virtual:aideck-deck";
const resolvedVirtualId = `\0${virtualId}`;
const deckPathKey = "AIDECK_DECK" + "_PATH";
const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
const engineRootKey = "AIDECK_ENGINE" + "_ROOT";

type LayoutEntry = { component: string; source: string };
type TemplateManifest = {
  name: string;
  displayName: string;
  deckClass?: string;
  supportedSlideTypes: string[];
};
type TemplateDefinition = {
  animationPath: string;
  deckClass: string;
  designSystemPath: string;
  imports: Map<string, Set<string>>;
  layouts: Record<string, LayoutEntry>;
  manifest: TemplateManifest;
};

export function aideckDeckPlugin(
  deckPath = process.env[deckPathKey],
  templatePath = process.env[templatePathKey],
  engineRoot = process.env[engineRootKey] ?? process.cwd(),
): Plugin {
  const watchedFiles = new Set<string>();

  return {
    name: "aideck-deck-manifest",
    async resolveId(id, importer) {
      if (id === virtualId) return resolvedVirtualId;
      const activeTemplateRoot = templatePath
        ? resolve(templatePath)
        : deckPath
          ? resolve(deckPath, "template")
          : undefined;
      if (!activeTemplateRoot || !importer || !isWithin(activeTemplateRoot, importer.split("?")[0])) return undefined;
      const match = id.replaceAll("\\", "/").match(/(?:^|\/)primitives(?:\/(.*))?$/);
      if (match) return this.resolve(join(resolve(engineRoot), "primitives", match[1] ?? ""), importer, { skipSelf: true });
      if (/^(?:@|[A-Za-z])/.test(id)) {
        return this.resolve(id, join(resolve(engineRoot), "preview-app", "src", "main.tsx"), { skipSelf: true });
      }
      return undefined;
    },
    load(id) {
      if (id !== resolvedVirtualId) return undefined;
      watchedFiles.clear();
      const source = deckPath
        ? loadDeckSource(resolve(deckPath), resolve(engineRoot), watchedFiles)
        : templatePath
          ? loadTemplateSource(resolve(templatePath), watchedFiles)
          : "export const runtimeDeck = null;\nexport const runtimeTemplate = null;";
      watchedFiles.forEach((file) => this.addWatchFile(file));
      return source;
    },
    handleHotUpdate({ file, server }) {
      if (!watchedFiles.has(resolve(file))) return;
      const module = server.moduleGraph.getModuleById(resolvedVirtualId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [module];
      }
    },
  };
}

function loadDeckSource(root: string, engineRoot: string, watchedFiles: Set<string>): string {
  const manifestPath = join(root, "deck.json");
  const contentPath = join(root, "content.md");
  if (!existsSync(manifestPath) || !existsSync(contentPath)) throw new Error(`Deck must contain deck.json and content.md: ${root}`);
  watchedFiles.add(manifestPath);
  watchedFiles.add(contentPath);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const templateRoot = deckTemplateRoot(root, engineRoot, manifest.template?.set);
  const definition = loadTemplateDefinition(templateRoot, watchedFiles);
  const source = generatedSource(root, manifest.slug);
  const sourceExport = source && readFileSync(source, "utf8").match(/export const (\w+Slides)\s*:/)?.[1];
  if (source && sourceExport) {
    watchedFiles.add(source);
    return `import { ${sourceExport} } from ${JSON.stringify(source)};
import ${JSON.stringify(definition.designSystemPath)};
import ${JSON.stringify(definition.animationPath)};
export const runtimeDeck = { id: ${JSON.stringify(manifest.slug)}, label: ${JSON.stringify(manifest.title)}, deckClass: ${JSON.stringify(definition.deckClass)}, slides: ${sourceExport} };
export const runtimeTemplate = null;`;
  }
  const componentImports = renderComponentImports(definition.imports);
  const componentMap = Object.entries(definition.layouts).map(([type, entry]) => `${JSON.stringify(type)}: ${entry.component}`);
  return `${componentImports.join("\n")}
import ${JSON.stringify(definition.designSystemPath)};
import ${JSON.stringify(definition.animationPath)};
import { createManifestDeckSource } from ${JSON.stringify(join(process.cwd(), "preview-app/src/manifest-deck-source.tsx"))};
const components = { ${componentMap.join(", ")} };
export const runtimeDeck = createManifestDeckSource(${JSON.stringify(manifest)}, ${JSON.stringify(readFileSync(contentPath, "utf8"))}, ${JSON.stringify(definition.deckClass)}, components);
export const runtimeTemplate = null;`;
}

function loadTemplateSource(root: string, watchedFiles: Set<string>): string {
  const definition = loadTemplateDefinition(root, watchedFiles);
  const { manifest } = definition;
  const slides = manifest.supportedSlideTypes.map((type) => {
    const entry = definition.layouts[type];
    return `{ type: ${JSON.stringify(type)}, Component: ${entry.component}, props: previewProps }`;
  });
  const componentImports = renderComponentImports(definition.imports);

  return `${componentImports.join("\n")}
import ${JSON.stringify(definition.designSystemPath)};
import ${JSON.stringify(definition.animationPath)};
const previewProps = ${JSON.stringify(templatePreviewProps())};
export const runtimeDeck = null;
export const runtimeTemplate = {
  id: ${JSON.stringify(manifest.name)},
  label: ${JSON.stringify(manifest.displayName)},
  deckClass: ${JSON.stringify(definition.deckClass)},
  slides: [${slides.join(",\n")}],
};`;
}

function templatePreviewProps(): Record<string, unknown> {
  return {
    kicker: "Template Preview",
    index: "01",
    title: "Design System Preview",
    body: "Review hierarchy, spacing, typography, color, and component behavior using representative content.",
    source: "AI Deck Kit",
    attribution: "Template system",
    caption: "Representative preview",
    items: ["First principle", "Supporting evidence", "Clear decision", "Next action"],
    icons: ["target", "chart", "shield", "rocket"],
    icon: "target",
    leftTitle: "Before",
    rightTitle: "After",
    leftItems: ["Fragmented structure", "Unclear hierarchy", "Manual handoffs"],
    rightItems: ["Unified system", "Visible hierarchy", "Reliable flow"],
    metric: "42%",
    metricLabel: "Representative metric",
    language: "ts",
    code: "export const preview = {\\n  status: \"ready\",\\n};",
    highlightLines: [2],
    commands: [{ prompt: "aideck serve --template example", output: "preview ready" }],
    flowSteps: [
      { from: "Content", to: "Template", label: "Compose" },
      { from: "Template", to: "Preview", label: "Render" },
    ],
    method: "POST",
    path: "/v1/preview",
    requestExample: '{\\n  "template": "example"\\n}',
    responseExample: '{\\n  "status": "ready"\\n}',
    tableColumns: ["Area", "Decision", "Status"],
    tableRows: [["Typography", "Clear hierarchy", "Ready"], ["Spacing", "Consistent rhythm", "Review"]],
    recommendedColumn: 1,
    context: "The template needs a coherent visual system.",
    decision: "Use one catalog-backed template set.",
    consequences: ["Consistent output", "Predictable review", "Portable source"],
  };
}

function inferDeckClass(css: string, templateName: string): string {
  return css.match(/\.([a-zA-Z][\w-]*-deck)\b/)?.[1] ?? `${templateName}-deck`;
}

function loadTemplateDefinition(root: string, watchedFiles: Set<string>): TemplateDefinition {
  const manifestPath = join(root, "template-manifest.json");
  const layoutIndexPath = join(root, "layouts", "layout-index.json");
  const designSystemPath = join(root, "design-system.css");
  const animationPath = join(root, "animation-presets.css");
  for (const file of [manifestPath, layoutIndexPath, designSystemPath, animationPath]) {
    if (!existsSync(file)) throw new Error(`Template preview file missing: ${file}`);
    watchedFiles.add(file);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  const rawIndex = JSON.parse(readFileSync(layoutIndexPath, "utf8")) as Record<string, LayoutEntry> & { layouts?: Record<string, LayoutEntry> };
  const layouts = rawIndex.layouts ?? rawIndex;
  const layoutsRoot = resolve(root, "layouts");
  const imports = new Map<string, Set<string>>();
  for (const type of manifest.supportedSlideTypes) {
    const entry = layouts[type];
    if (!entry?.component || !entry?.source) throw new Error(`Template layout missing for supported slide type "${type}".`);
    if (!/^[A-Za-z_$][\w$]*$/.test(entry.component)) throw new Error(`Invalid component export "${entry.component}" for "${type}".`);
    const source = resolve(layoutsRoot, entry.source);
    if (!isWithin(layoutsRoot, source)) throw new Error(`Template layout source for "${type}" must stay inside layouts/: ${entry.source}`);
    if (!existsSync(source)) throw new Error(`Template layout source missing: ${source}`);
    watchedFiles.add(source);
    const names = imports.get(source) ?? new Set<string>();
    names.add(entry.component);
    imports.set(source, names);
  }
  return {
    animationPath,
    designSystemPath,
    deckClass: manifest.deckClass ?? inferDeckClass(readFileSync(designSystemPath, "utf8"), manifest.name),
    imports,
    layouts,
    manifest,
  };
}

function renderComponentImports(imports: Map<string, Set<string>>): string[] {
  return [...imports].map(([source, names]) => `import { ${[...names].join(", ")} } from ${JSON.stringify(source)};`);
}

function deckTemplateRoot(root: string, engineRoot: string, templateName?: string): string {
  const embedded = join(root, "template");
  if (existsSync(join(embedded, "template-manifest.json"))) return embedded;
  if (!templateName) throw new Error(`Deck template is missing: ${root}`);
  return join(engineRoot, "templates", `${templateName}.template`);
}

function isWithin(root: string, file: string): boolean {
  const path = relative(root, resolve(file));
  return path === "" || (!path.startsWith("..") && !path.startsWith("/"));
}

function generatedSource(root: string, slug: string): string | undefined {
  const sourceRoot = join(root, ".build", "source");
  if (!existsSync(sourceRoot)) return undefined;
  return readdirSync(sourceRoot).map((file) => join(sourceRoot, file)).find((file) => file.endsWith(".tsx") && file.includes(slug));
}
