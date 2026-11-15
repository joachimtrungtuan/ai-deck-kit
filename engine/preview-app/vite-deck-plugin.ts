import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { Plugin } from "vite";
import { isMap, parseDocument } from "yaml";
import { collectDeckAssetTable, isWithin, referencedAssetKeysBySlide, type AssetDelivery } from "./deck-asset-table.ts";
import { contentRevision, readJsonBody, readSlideYamlBlock, replaceSlideYamlBlock, respondJson } from "./slide-yaml-block-editing.ts";
import { stripSpeakerNotes } from "./strip-speaker-notes.ts";
import { loadTemplateDefinition, renderComponentImports, renderFontImports, renderTemplateStyleImports } from "./template-definition-loading.ts";
import { loadGallerySource, loadTemplateSource, type GalleryEntry } from "./template-preview-source.ts";

export { readSlideYamlBlock, replaceSlideYamlBlock } from "./slide-yaml-block-editing.ts";
export { templatePreviewSlideId, type GalleryEntry } from "./template-preview-source.ts";

const virtualId = "virtual:aideck-deck";
const resolvedVirtualId = `\0${virtualId}`;
const deckPathKey = "AIDECK_DECK" + "_PATH";
const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
const engineRootKey = "AIDECK_ENGINE" + "_ROOT";
const galleryKey = "AIDECK_TEMPLATE" + "_GALLERY";
const exportManifestKey = "AIDECK" + "_BLOCKS_PATH";
let exportManifestText: string | undefined;

export function parseGallery(raw = process.env[galleryKey]): GalleryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GalleryEntry[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.name && entry?.root) : [];
  } catch {
    return [];
  }
}

export function aideckDeckPlugin(
  deckPath = process.env[deckPathKey],
  templatePath = process.env[templatePathKey],
  engineRoot = process.env[engineRootKey] ?? process.cwd(),
  gallery = parseGallery(),
  { stripNotes = false, assetDelivery = "embedded" }: { stripNotes?: boolean; assetDelivery?: AssetDelivery } = {},
): Plugin {
  const watchedFiles = new Set<string>();
  // Linked delivery ships the referenced files beside the page; these are the keys to copy.
  let linkedAssetKeys: string[] = [];
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
        ? loadDeckSource(resolve(deckPath), resolve(engineRoot), watchedFiles, { stripNotes, assetDelivery, onAssetKeys: (keys) => { linkedAssetKeys = keys; } })
        : templatePath
          ? loadTemplateSource(resolve(templatePath), watchedFiles)
          : "export const runtimeDeck = null;\nexport const runtimeTemplate = null;\nexport const deckAssets = {};";
      // Presenter mode mirrors the built export through Vite's /@fs route (same origin, no middleware).
      const exportUrl = deckPath ? `/@fs${join(resolve(deckPath), ".build", "export", "index.html").replaceAll("\\", "/")}` : null;
      const combined = `${loadGallerySource(gallery, watchedFiles)}\n${source}\nexport const runtimeDeckExportUrl = ${JSON.stringify(exportUrl)};\nexport const runtimeServerRunId = ${JSON.stringify(serverRunId)};`;
      watchedFiles.forEach((file) => this.addWatchFile(file));
      return combined;
    },
    // Linked delivery: the page points at files, so the referenced ones are emitted beside it.
    generateBundle() {
      if (process.env[exportManifestKey] && exportManifestText) {
        this.emitFile({ type: "asset", fileName: ".asset-manifest.json", source: exportManifestText });
      }
      if (assetDelivery !== "linked" || !deckPath) return;
      for (const key of linkedAssetKeys) {
        this.emitFile({ type: "asset", fileName: key, source: readFileSync(join(resolve(deckPath), key)) });
      }
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

type DeckSourceOptions = { stripNotes: boolean; assetDelivery: AssetDelivery; onAssetKeys: (keys: string[]) => void };

function loadDeckSource(root: string, engineRoot: string, watchedFiles: Set<string>, { stripNotes, assetDelivery, onAssetKeys }: DeckSourceOptions): string {
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
  const rawContent = readFileSync(contentPath, "utf8");
  const content = stripNotes ? stripSpeakerNotes(rawContent) : rawContent;
  const assetTable = collectDeckAssetTable(content, root, watchedFiles, assetDelivery);
  onAssetKeys(Object.keys(assetTable));
  writeExportAssetManifest({ slides: referencedAssetKeysBySlide(content), assets: assetTable });
  // An export build inlines assets itself unless they are linked, so the runtime sees each key as its own URL.
  const deckAssets = process.env[exportManifestKey] && assetDelivery !== "linked"
    ? Object.fromEntries(Object.keys(assetTable).map((key) => [key, key]))
    : assetTable;
  const source = generatedSource(root, manifest.slug);
  const sourceExport = source && readFileSync(source, "utf8").match(/export const (\w+Slides)\s*:/)?.[1];
  if (source && sourceExport) {
    watchedFiles.add(source);
    return `import { ${sourceExport} } from ${JSON.stringify(source)};
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
export const runtimeDeck = { id: ${JSON.stringify(manifest.slug)}, label: ${JSON.stringify(manifest.title)}, deckClass: ${JSON.stringify(definition.deckClass)}, slides: ${sourceExport}, contentSchemaMajor: ${JSON.stringify(contentSchemaMajor(manifest.contentSchemaVersion))}, defaultTransition: ${JSON.stringify(defaultTransition)} };
export const runtimeTemplate = null;
export const deckAssets = ${JSON.stringify(deckAssets)};`;
  }
  const componentImports = renderComponentImports(definition.imports);
  const componentMap = Object.entries(definition.layouts).map(([type, entry]) => `${JSON.stringify(type)}: ${entry.component}`);
  const resolvedManifest = { ...manifest, defaults: { ...manifest.defaults, transition: defaultTransition } };
  return `${componentImports.join("\n")}
${renderFontImports(definition).join("\n")}
${renderTemplateStyleImports(definition).join("\n")}
import { createManifestDeckSource } from ${JSON.stringify(join(process.cwd(), "preview-app/src/manifest-deck-source.tsx"))};
const components = { ${componentMap.join(", ")} };
export const runtimeDeck = createManifestDeckSource(${JSON.stringify(resolvedManifest)}, ${JSON.stringify(content)}, ${JSON.stringify(definition.deckClass)}, components);
export const runtimeTemplate = null;
export const deckAssets = ${JSON.stringify(deckAssets)};`;
}

function writeExportAssetManifest(manifest: { slides: string[][]; assets: Record<string, string> }): void {
  const target = process.env[exportManifestKey];
  if (!target) return;
  exportManifestText = JSON.stringify(manifest);
}

function contentSchemaMajor(version: unknown): number {
  const match = typeof version === "string" ? /^(\d+)\.\d+\.\d+$/.exec(version) : undefined;
  return match ? Number(match[1]) : 1;
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

function generatedSource(root: string, slug: string): string | undefined {
  const sourceRoot = join(root, ".build", "source");
  if (!existsSync(sourceRoot)) return undefined;
  return readdirSync(sourceRoot).map((file) => join(sourceRoot, file)).find((file) => file.endsWith(".tsx") && file.includes(slug));
}
