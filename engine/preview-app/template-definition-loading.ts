import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { resolveFontImports } from "../cli/lib/font-catalog.ts";
import { isWithin } from "./deck-asset-table.ts";

type LayoutEntry = { component: string; source: string };
type TemplateManifest = {
  name: string;
  displayName: string;
  deckClass?: string;
  fonts?: string[];
  layoutVariants?: Record<string, string[]>;
  supportedSlideTypes: string[];
  defaultTransition?: string;
};
export type TemplateDefinition = {
  animationPath?: string;
  deckClass: string;
  designSystemPath: string;
  fontImports: string[];
  imports: Map<string, Set<string>>;
  layouts: Record<string, LayoutEntry>;
  manifest: TemplateManifest;
  previewProps: Record<string, unknown>;
};

/** Side-effect imports for the typefaces a template declared. Duplicates across templates are harmless. */
export function renderFontImports(definition: TemplateDefinition): string[] {
  return definition.fontImports.map((specifier) => `import ${JSON.stringify(specifier)};`);
}

export function renderTemplateStyleImports(definition: TemplateDefinition): string[] {
  return [definition.designSystemPath, definition.animationPath]
    .filter((path): path is string => Boolean(path))
    .map((path) => `import ${JSON.stringify(path)};`);
}

/**
 * Baseline fixtures every template preview starts from. Templates extend or replace individual keys
 * through their own `preview-props.json`; nothing here is a template-specific value.
 */
function defaultPreviewProps(): Record<string, unknown> {
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

export function loadTemplateDefinition(root: string, watchedFiles: Set<string>): TemplateDefinition {
  const manifestPath = join(root, "template-manifest.json");
  const layoutIndexPath = join(root, "layouts", "layout-index.json");
  const designSystemPath = join(root, "design-system.css");
  const animationPath = join(root, "animation-presets.css");
  for (const file of [manifestPath, layoutIndexPath, designSystemPath]) {
    if (!existsSync(file)) throw new Error(`Template preview file missing: ${file}`);
    watchedFiles.add(file);
  }
  if (existsSync(animationPath)) watchedFiles.add(animationPath);
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
    animationPath: existsSync(animationPath) ? animationPath : undefined,
    designSystemPath,
    deckClass: manifest.deckClass ?? inferDeckClass(readFileSync(designSystemPath, "utf8"), manifest.name),
    fontImports: resolveFontImports(manifest.fonts),
    imports,
    layouts,
    manifest,
    previewProps: loadPreviewProps(root, watchedFiles),
  };
}

/**
 * Fixture props for the template's own preview slides. A template supplies whatever the engine's
 * defaults do not cover through `preview-props.json` at its bundle root — this is why adding a
 * layout that needs a novel prop never requires touching the engine.
 */
function loadPreviewProps(root: string, watchedFiles: Set<string>): Record<string, unknown> {
  const path = join(root, "preview-props.json");
  if (!existsSync(path)) return defaultPreviewProps();
  watchedFiles.add(path);
  const declared = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!declared || typeof declared !== "object" || Array.isArray(declared)) throw new Error(`Template preview props must be a JSON object: ${path}`);
  // Shallow merge: a template replacing `items` means its whole list, not a blend with the default.
  return { ...defaultPreviewProps(), ...(declared as Record<string, unknown>) };
}

export function renderComponentImports(imports: Map<string, Set<string>>): string[] {
  return [...imports].map(([source, names]) => `import { ${[...names].join(", ")} } from ${JSON.stringify(source)};`);
}
