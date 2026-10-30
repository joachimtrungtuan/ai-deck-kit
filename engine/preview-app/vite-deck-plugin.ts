import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { Plugin } from "vite";
import { isMap, parseDocument } from "yaml";
import { resolveFontImports } from "../cli/lib/font-catalog.ts";
import { stripSpeakerNotes } from "./strip-speaker-notes.ts";

const virtualId = "virtual:aideck-deck";
const resolvedVirtualId = `\0${virtualId}`;
const deckPathKey = "AIDECK_DECK" + "_PATH";
const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
const engineRootKey = "AIDECK_ENGINE" + "_ROOT";
const galleryKey = "AIDECK_TEMPLATE" + "_GALLERY";

/** One resolvable template, as the CLI resolved it. The preview never resolves templates itself. */
export type GalleryEntry = { name: string; root: string; origin: string };

export function parseGallery(raw = process.env[galleryKey]): GalleryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GalleryEntry[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.name && entry?.root) : [];
  } catch {
    return [];
  }
}

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
type TemplateDefinition = {
  animationPath?: string;
  deckClass: string;
  designSystemPath: string;
  fontImports: string[];
  imports: Map<string, Set<string>>;
  layouts: Record<string, LayoutEntry>;
  manifest: TemplateManifest;
  previewProps: Record<string, unknown>;
};

export function aideckDeckPlugin(
  deckPath = process.env[deckPathKey],
  templatePath = process.env[templatePathKey],
  engineRoot = process.env[engineRootKey] ?? process.cwd(),
  gallery = parseGallery(),
  { stripNotes = false }: { stripNotes?: boolean } = {},
): Plugin {
  const watchedFiles = new Set<string>();
  const galleryRoots = gallery.map((entry) => resolve(entry.root));
  // Identifies one dev-server process, so per-server presenter preferences can expire with it.
  let serverRunId: number | null = null;

  return {
    name: "aideck-deck-manifest",
    configResolved(config) {
      serverRunId = config.command === "serve" ? Date.now() : null;
    },
    async resolveId(id, importer) {
      if (id === virtualId) return resolvedVirtualId;
      const migratedTemplateImport = deckPath && importer
        ? resolveGeneratedTemplateImport(id, importer.split("?")[0], deckPath, engineRoot)
        : undefined;
      if (migratedTemplateImport) {
        return this.resolve(migratedTemplateImport, importer, { skipSelf: true });
      }
      const activeTemplateRoot = templatePath
        ? resolve(templatePath)
        : deckPath
          ? resolve(deckPath, "template")
          : undefined;
      // Gallery templates live outside the active target — their layouts still need engine-relative
      // resolution for React, primitives and other bare imports.
      const importerPath = importer?.split("?")[0];
      const owningRoot = [activeTemplateRoot, ...galleryRoots].find((root) => root && importerPath && isWithin(root, importerPath));
      if (!owningRoot || !importer) return undefined;
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
        ? loadDeckSource(resolve(deckPath), resolve(engineRoot), watchedFiles, stripNotes)
        : templatePath
          ? loadTemplateSource(resolve(templatePath), watchedFiles)
          : "export const runtimeDeck = null;\nexport const runtimeTemplate = null;";
      // Presenter mode mirrors the built export through Vite's /@fs route (same origin, no middleware).
      const exportUrl = deckPath ? `/@fs${join(resolve(deckPath), ".build", "export", "index.html").replaceAll("\\", "/")}` : null;
      const combined = `${loadGallerySource(gallery, watchedFiles)}\n${source}\nexport const runtimeDeckExportUrl = ${JSON.stringify(exportUrl)};\nexport const runtimeServerRunId = ${JSON.stringify(serverRunId)};`;
      watchedFiles.forEach((file) => this.addWatchFile(file));
      return combined;
    },
    handleHotUpdate({ file, server }) {
      if (!watchedFiles.has(resolve(file))) return;
      const module = server.moduleGraph.getModuleById(resolvedVirtualId);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [module];
      }
    },
    configureServer(server) {
      if (!deckPath) return;
      const contentPath = resolve(deckPath, "content.md");
      server.middlewares.use("/__aideck/slide-yaml", async (request, response) => {
        try {
          if (request.method === "GET") {
            const slideId = new URL(request.url ?? "", "http://localhost").searchParams.get("slideId");
            if (!slideId) return respondJson(response, 400, { error: "slideId is required." });
            const content = readFileSync(contentPath, "utf8");
            const yaml = readSlideYamlBlock(content, slideId);
            if (yaml === undefined) return respondJson(response, 404, { error: `Unknown slide id: ${slideId}` });
            return respondJson(response, 200, { yaml, revision: contentRevision(content) });
          }

          if (request.method !== "POST") return respondJson(response, 405, { error: "Method not allowed." });
          const body = await readJsonBody(request);
          if (typeof body.slideId !== "string" || typeof body.yaml !== "string" || typeof body.revision !== "string") {
            return respondJson(response, 400, { error: "slideId, yaml, and revision are required." });
          }
          const content = readFileSync(contentPath, "utf8");
          if (contentRevision(content) !== body.revision) return respondJson(response, 409, { error: "content.md changed; re-read before saving." });
          const previousYaml = readSlideYamlBlock(content, body.slideId);
          if (previousYaml === undefined) return respondJson(response, 404, { error: `Unknown slide id: ${body.slideId}` });
          const yamlDocument = parseDocument(body.yaml);
          if (yamlDocument.errors.length) return respondJson(response, 400, { error: "YAML is invalid." });
          const previousDocument = parseDocument(previousYaml);
          if (!isMap(yamlDocument.contents) || yamlDocument.get("id") !== previousDocument.get("id") || yamlDocument.get("type") !== previousDocument.get("type")) {
            return respondJson(response, 400, { error: "id and type must remain unchanged." });
          }
          // The fence body is spliced in without its surrounding newlines, so a trailing one
          // from the serializer would grow a blank line before the closing fence on every save.
          const nextContent = replaceSlideYamlBlock(content, body.slideId, body.yaml.replace(/\n+$/, ""));
          writeFileSync(contentPath, nextContent);
          return respondJson(response, 200, { revision: contentRevision(nextContent) });
        } catch (error) {
          return respondJson(response, 400, { error: error instanceof Error ? error.message : "Could not update slide YAML." });
        }
      });
    },
  };
}

type SlideYamlBlock = { bodyEnd: number; bodyStart: number; yaml: string };

/** Returns the raw YAML fence body for a slide identified by its YAML id. */
export function readSlideYamlBlock(content: string, slideId: string): string | undefined {
  return findSlideYamlBlock(content, slideId)?.yaml;
}

/** Replaces only the YAML fence body for one slide, preserving all surrounding bytes. */
export function replaceSlideYamlBlock(content: string, slideId: string, yamlBody: string): string {
  const block = findSlideYamlBlock(content, slideId);
  if (!block) {
    const section = findSlideSection(content, slideId);
    if (section) throw new Error(`Slide ${slideId} has no YAML fence.`);
    throw new Error(`Unknown slide id: ${slideId}`);
  }
  return `${content.slice(0, block.bodyStart)}${yamlBody}${content.slice(block.bodyEnd)}`;
}

function findSlideYamlBlock(content: string, slideId: string): SlideYamlBlock | undefined {
  const section = findSlideSection(content, slideId);
  if (!section) return undefined;
  const fence = /```ya?ml\r?\n([\s\S]*?)\r?\n```/.exec(section.text);
  if (!fence || fence.index === undefined) return undefined;
  const bodyStart = section.start + fence.index + fence[0].indexOf(fence[1]);
  return { bodyStart, bodyEnd: bodyStart + fence[1].length, yaml: fence[1] };
}

function findSlideSection(content: string, slideId: string): { start: number; text: string } | undefined {
  const headers = [...content.matchAll(/^## Slide\s+\d+.*$/gm)];
  for (let index = 0; index < headers.length; index += 1) {
    const start = headers[index].index ?? 0;
    const text = content.slice(start, headers[index + 1]?.index ?? content.length);
    const fence = /```ya?ml\r?\n([\s\S]*?)\r?\n```/.exec(text);
    if (!fence && new RegExp(`^id:\\s*(?:${escapeRegExp(slideId)}|"${escapeRegExp(slideId)}"|'${escapeRegExp(slideId)}')\\s*$`, "m").test(text)) return { start, text };
    if (!fence) continue;
    const document = parseDocument(fence[1]);
    if (!document.errors.length && document.get("id") === slideId) return { start, text };
  }
  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function contentRevision(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** One slide fence, so a couple of megabytes is already far past any real deck. Capping the
 * body keeps a runaway or hostile request on the dev server from buffering without bound. */
const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;

function readJsonBody(request: NodeJS.ReadableStream): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      if (raw.length > MAX_REQUEST_BODY_BYTES) return;
      raw += chunk;
      if (raw.length > MAX_REQUEST_BODY_BYTES) reject(new Error("Request body is too large."));
    });
    request.on("end", () => {
      try {
        resolveBody(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error("Request body must be JSON."));
      }
    });
    request.on("error", reject);
  });
}

function respondJson(response: { end: (body: string) => void; setHeader: (name: string, value: string) => void; statusCode: number }, status: number, body: Record<string, string>): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

export function resolveGeneratedTemplateImport(
  id: string,
  importer: string,
  deckRoot: string,
  engineRoot: string,
): string | undefined {
  if (!isWithin(resolve(deckRoot), importer)) return undefined;
  const requested = resolve(dirname(importer), id);
  const templatesRoot = resolve(engineRoot, "templates");
  if (!isWithin(templatesRoot, requested)) return undefined;
  const [templateName, ...nestedPath] = relative(templatesRoot, requested).split(/[\\/]/);
  if (!templateName || templateName.endsWith(".template")) return undefined;
  const migrated = join(templatesRoot, `${templateName}.template`, ...nestedPath);
  return existsSync(migrated) ? migrated : undefined;
}

function loadDeckSource(root: string, engineRoot: string, watchedFiles: Set<string>, stripNotes: boolean): string {
  const manifestPath = join(root, "deck.json");
  const contentPath = join(root, "content.md");
  if (!existsSync(manifestPath) || !existsSync(contentPath)) throw new Error(`Deck must contain deck.json and content.md: ${root}`);
  watchedFiles.add(manifestPath);
  watchedFiles.add(contentPath);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const templateRoot = deckTemplateRoot(root, engineRoot, manifest.template?.set);
  const definition = loadTemplateDefinition(templateRoot, watchedFiles);
  // Three-tier resolution, done once here so every downstream consumer (generated source, the
  // manifest-driven branch) sees an already-resolved value: per-slide transitions still override in
  // the runtime, but the deck-level default itself falls back through the template before "none".
  const defaultTransition = manifest.defaults?.transition ?? definition.manifest.defaultTransition ?? "none";
  const source = generatedSource(root, manifest.slug);
  const sourceExport = source && readFileSync(source, "utf8").match(/export const (\w+Slides)\s*:/)?.[1];
  if (source && sourceExport) {
    watchedFiles.add(source);
    return `import { ${sourceExport} } from ${JSON.stringify(source)};
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
export const runtimeDeck = { id: ${JSON.stringify(manifest.slug)}, label: ${JSON.stringify(manifest.title)}, deckClass: ${JSON.stringify(definition.deckClass)}, slides: ${sourceExport}, contentSchemaMajor: ${JSON.stringify(contentSchemaMajor(manifest.contentSchemaVersion))}, defaultTransition: ${JSON.stringify(defaultTransition)} };
export const runtimeTemplate = null;`;
  }
  const componentImports = renderComponentImports(definition.imports);
  const componentMap = Object.entries(definition.layouts).map(([type, entry]) => `${JSON.stringify(type)}: ${entry.component}`);
  const resolvedManifest = { ...manifest, defaults: { ...manifest.defaults, transition: defaultTransition } };
  const rawContent = readFileSync(contentPath, "utf8");
  const content = inlineDeckAssets(stripNotes ? stripSpeakerNotes(rawContent) : rawContent, root, watchedFiles);
  return `${componentImports.join("\n")}
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
import { createManifestDeckSource } from ${JSON.stringify(join(process.cwd(), "preview-app/src/manifest-deck-source.tsx"))};
const components = { ${componentMap.join(", ")} };
export const runtimeDeck = createManifestDeckSource(${JSON.stringify(resolvedManifest)}, ${JSON.stringify(content)}, ${JSON.stringify(definition.deckClass)}, components);
export const runtimeTemplate = null;`;
}

function contentSchemaMajor(version: unknown): number {
  const match = typeof version === "string" ? /^(\d+)\.\d+\.\d+$/.exec(version) : undefined;
  return match ? Number(match[1]) : 1;
}

const assetMimeTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
};

/**
 * `content.md` references images as deck-relative `assets/<file>` paths (per the deck-format spec)
 * so they travel with the portable `.deck` bundle. Neither the dev server nor the export build has
 * a route or asset pipeline that resolves that path, so — same as the manual workaround decks
 * already use for generated art — inline each referenced file as a base64 data URI at load time.
 * This runs identically for `aideck serve` and `aideck export`, since both share this plugin.
 */
export function inlineDeckAssets(content: string, deckRoot: string, watchedFiles: Set<string>): string {
  const assetsRoot = resolve(deckRoot, "assets");
  return content.replace(/(["'])assets\/([^"']+)\1/g, (match, quote: string, relPath: string) => {
    const filePath = resolve(assetsRoot, relPath);
    if (!isWithin(assetsRoot, filePath)) throw new Error(`Asset path escapes deck assets/: ${relPath}`);
    if (!existsSync(filePath)) throw new Error(`Referenced asset not found: assets/${relPath} (deck: ${deckRoot})`);
    watchedFiles.add(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const mime = assetMimeTypes[ext];
    if (!mime) throw new Error(`Unsupported asset type ".${ext}" for assets/${relPath}`);
    const data = readFileSync(filePath).toString("base64");
    return `${quote}data:${mime};base64,${data}${quote}`;
  });
}

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

/** Side-effect imports for the typefaces a template declared. Duplicates across templates are harmless. */
function renderFontImports(definition: TemplateDefinition): string[] {
  return definition.fontImports.map((specifier) => `import ${JSON.stringify(specifier)};`);
}

function renderTemplateStyleImports(definition: TemplateDefinition): string[] {
  return [definition.designSystemPath, definition.animationPath]
    .filter((path): path is string => Boolean(path))
    .map((path) => `import ${JSON.stringify(path)};`);
}

/**
 * The gallery is exactly the set of templates the CLI could resolve for this project — shipped
 * defaults and the user's own, with the user's winning. Nothing here is hardcoded per template.
 */
function loadGallerySource(gallery: GalleryEntry[], watchedFiles: Set<string>): string {
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

function loadTemplateSource(root: string, watchedFiles: Set<string>): string {
  const definition = loadTemplateDefinition(root, watchedFiles);
  const { manifest } = definition;
  const slides = templateSlideEntries(definition);
  const componentImports = renderComponentImports(definition.imports);

  return `${componentImports.join("\n")}
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
const previewProps = ${JSON.stringify(definition.previewProps)};
export const runtimeDeck = null;
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

function loadTemplateDefinition(root: string, watchedFiles: Set<string>): TemplateDefinition {
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

function renderComponentImports(imports: Map<string, Set<string>>): string[] {
  return [...imports].map(([source, names]) => `import { ${[...names].join(", ")} } from ${JSON.stringify(source)};`);
}

/**
 * A deck renders from its own frozen snapshot. The fallbacks below exist only for a deck whose
 * snapshot was lost, and they follow the CLI's precedence — the user's template before the shipped
 * default — so the preview can never quietly substitute a different design.
 */
function deckTemplateRoot(root: string, engineRoot: string, templateName?: string): string {
  const embedded = join(root, "template");
  if (existsSync(join(embedded, "template-manifest.json"))) return embedded;
  if (!templateName) throw new Error(`Deck template is missing: ${root}`);
  const projectRoot = resolve(engineRoot, "..");
  const candidates = [
    join(projectRoot, "templates", `${templateName}.template`),
    join(engineRoot, "templates", `${templateName}.template`),
  ];
  const found = candidates.find((candidate) => existsSync(join(candidate, "template-manifest.json")));
  if (!found) {
    throw new Error(`Deck "${root}" has no template snapshot and template "${templateName}" was not found. Run: aideck deck retemplate <slug> --to <template>`);
  }
  return found;
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
