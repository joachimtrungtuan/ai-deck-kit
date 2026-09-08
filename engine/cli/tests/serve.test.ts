import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildServeViteArgs, parseServeArgs } from "../commands/output.ts";
import { createTemplate, elementAnimationCatalogV1, listTemplates, migrateLegacyRegisteredTemplates, resolveTemplate, validateMotionTokens, validateTemplateBundle, validateTemplateManifest, type TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";
import { resolveFontImports } from "../lib/font-catalog.ts";
import { aideckDeckPlugin, inlineDeckAssets, readSlideYamlBlock, replaceSlideYamlBlock, resolveGeneratedTemplateImport, templatePreviewSlideId } from "../../preview-app/vite-deck-plugin.ts";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cli = join(projectRoot, "engine", "cli", "index.mjs");

type SlideYamlEndpoint = (request: Readable & { method?: string; url?: string }, response: { end: (body: string) => void; setHeader: () => void; statusCode: number }) => Promise<void>;

function deckYamlEndpoint(deckRoot: string | undefined): SlideYamlEndpoint | undefined {
  let endpoint: SlideYamlEndpoint | undefined;
  const configured = aideckDeckPlugin(deckRoot).configureServer;
  const configureServer = (typeof configured === "function" ? configured : configured?.handler) as ((server: unknown) => void) | undefined;
  configureServer?.({
    middlewares: { use: (path: string, handler: SlideYamlEndpoint) => {
      if (path === "/__aideck/slide-yaml") endpoint = handler;
    } },
  } as never);
  return endpoint;
}

async function callEndpoint(endpoint: SlideYamlEndpoint, method: string, url: string, body?: unknown): Promise<{ body: string; status: number }> {
  const request = Readable.from(body === undefined ? [] : [JSON.stringify(body)]) as Readable & { method?: string; url?: string };
  request.method = method;
  request.url = url;
  let responseBody = "";
  const response = { end: (value: string) => { responseBody = value; }, setHeader: () => undefined, statusCode: 0 };
  await endpoint(request, response);
  return { body: responseBody, status: response.statusCode };
}

test("serve help documents template selection and headless mode", () => {
  const output = execFileSync(process.execPath, [cli, "--help"], { cwd: projectRoot, encoding: "utf8" });
  assert.match(output, /serve \[<deck-id> \| deck <id> \| template <name>/);
  assert.match(output, /--no-open/);
});

test("serve normalizes gallery, deck, and template command forms", () => {
  assert.deepEqual(parseServeArgs(["serve"]), { open: true });
  assert.deepEqual(parseServeArgs(["serve", "showcase"]), { deck: "showcase", open: true });
  assert.deepEqual(parseServeArgs(["serve", "deck", "showcase"]), { deck: "showcase", open: true });
  assert.deepEqual(parseServeArgs(["serve", "--deck", "showcase"]), { deck: "showcase", open: true });
  assert.deepEqual(parseServeArgs(["serve", "template", "linear-dark"]), { open: true, template: "linear-dark" });
  assert.deepEqual(parseServeArgs(["serve", "--template", "linear-dark"]), { open: true, template: "linear-dark" });
});

test("serve validates ambiguous targets and forwards browser-open options", () => {
  assert.throws(() => parseServeArgs(["serve", "deck"]), /deck requires a value/);
  assert.throws(() => parseServeArgs(["serve", "unknown", "extra"]), /Unknown serve arguments/);
  assert.throws(
    () => parseServeArgs(["serve", "showcase", "--template", "linear-dark"]),
    /Choose one serve target/,
  );
  assert.throws(() => parseServeArgs(["serve", "--deck", "first", "--deck", "second"]), /--deck can only be provided once/);
  assert.throws(
    () => parseServeArgs(["serve", "--template", "first", "--template", "second"]),
    /--template can only be provided once/,
  );
  assert.deepEqual(buildServeViteArgs(parseServeArgs(["serve", "--port", "4173"])), [
    "--host", "127.0.0.1", "--port", "4173", "--open",
  ]);
  assert.deepEqual(buildServeViteArgs(parseServeArgs(["serve", "--no-open"])), ["--host", "127.0.0.1"]);
});

test("generated deck sources resolve legacy unsuffixed installed template imports", () => {
  const workspace = fixtureWorkspace();
  const source = join(workspace.decksRoot, "legacy.deck", ".build", "source", "legacy-deck.tsx");
  const installed = join(workspace.engineRoot, "templates", "linear-dark.template", "layouts", "react");
  mkdirSync(installed, { recursive: true });
  mkdirSync(join(source, ".."), { recursive: true });
  writeFileSync(source, "export const legacySlides = [];\n");

  assert.equal(
    resolveGeneratedTemplateImport(
      "../../../../engine/templates/linear-dark/layouts/react",
      source,
      workspace.decksRoot,
      workspace.engineRoot,
    ),
    installed,
  );
});

test("inlineDeckAssets rewrites assets/ references in content.md to base64 data URIs", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-inline-assets-test-"));
  mkdirSync(join(root, "assets"), { recursive: true });
  writeFileSync(join(root, "assets", "diagram.png"), Buffer.from("fake-png-bytes"));
  const watched = new Set<string>();

  const output = inlineDeckAssets(`imageSrc: "assets/diagram.png"\n`, root, watched);

  const expected = Buffer.from("fake-png-bytes").toString("base64");
  assert.equal(output, `imageSrc: "data:image/png;base64,${expected}"\n`);
  assert.ok(watched.has(join(root, "assets", "diagram.png")));
});

test("inlineDeckAssets rejects asset paths that escape the deck's assets/ folder", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-inline-assets-test-"));
  mkdirSync(join(root, "assets"), { recursive: true });
  assert.throws(
    () => inlineDeckAssets(`imageSrc: "assets/../../../etc/passwd"\n`, root, new Set()),
    /escapes deck assets\//,
  );
});

test("inlineDeckAssets reports a clear error for a missing referenced asset", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-inline-assets-test-"));
  mkdirSync(join(root, "assets"), { recursive: true });
  assert.throws(
    () => inlineDeckAssets(`imageSrc: "assets/missing.png"\n`, root, new Set()),
    /Referenced asset not found: assets\/missing\.png/,
  );
});

test("slide YAML helpers replace only the requested fence body", () => {
  const content = `# Deck\n\n## Slide 01: First\n\n\`\`\`yaml\n# retained\nid: first\ntype: title\ntitle: Before\n\`\`\`\n\n### Speaker Notes\n\nKeep this.\n\n## Slide 02: Second\n\n\`\`\`yaml\nid: second\ntype: title\ntitle: Unchanged\n\`\`\`\n`;
  const replacement = "# retained\nid: first\ntype: title\ntitle: After";

  assert.equal(readSlideYamlBlock(content, "first"), "# retained\nid: first\ntype: title\ntitle: Before");
  assert.equal(readSlideYamlBlock(content, "second"), "id: second\ntype: title\ntitle: Unchanged");
  assert.equal(
    replaceSlideYamlBlock(content, "first", replacement),
    content.replace("# retained\nid: first\ntype: title\ntitle: Before", replacement),
  );
});

test("slide YAML helpers reject missing ids and fence-less sections", () => {
  const content = `## Slide 01: First\n\n\`\`\`yaml\nid: first\ntype: title\n\`\`\`\n\n## Slide 02: No Fence\n\nid: "second"\n`;

  assert.equal(readSlideYamlBlock(content, "missing"), undefined);
  assert.throws(() => replaceSlideYamlBlock(content, "missing", "id: missing"), /Unknown slide id/);
  assert.throws(() => replaceSlideYamlBlock(content, "second", "id: second"), /has no YAML fence/);
});

test("deck preview middleware reads, writes, and protects raw slide YAML", async () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-slide-yaml-test-"));
  const contentPath = join(root, "content.md");
  writeFileSync(contentPath, `## Slide 01: First\n\n\`\`\`yaml\nid: first\ntype: title\ntitle: Before\n\`\`\`\n\n### Speaker Notes\n\nUntouched.\n`);
  const endpoint = deckYamlEndpoint(root);
  if (!endpoint) throw new Error("Deck middleware was not registered.");

  const read = await callEndpoint(endpoint, "GET", "?slideId=first");
  assert.equal(read.status, 200);
  const loaded = JSON.parse(read.body) as { revision: string; yaml: string };
  assert.match(loaded.yaml, /title: Before/);

  const saved = await callEndpoint(endpoint, "POST", "", { slideId: "first", yaml: "id: first\ntype: title\ntitle: After", revision: loaded.revision });
  assert.equal(saved.status, 200);
  assert.equal(readFileSync(contentPath, "utf8"), `## Slide 01: First\n\n\`\`\`yaml\nid: first\ntype: title\ntitle: After\n\`\`\`\n\n### Speaker Notes\n\nUntouched.\n`);

  const locked = await callEndpoint(endpoint, "POST", "", { slideId: "first", yaml: "id: changed\ntype: title\ntitle: After", revision: JSON.parse(saved.body).revision });
  assert.equal(locked.status, 400);
  assert.match(locked.body, /id and type must remain unchanged/);

  const conflict = await callEndpoint(endpoint, "POST", "", { slideId: "first", yaml: "id: first", revision: loaded.revision });
  assert.equal(conflict.status, 409);
  const invalid = await callEndpoint(endpoint, "POST", "", { slideId: "first", yaml: "title: [", revision: JSON.parse(saved.body).revision });
  assert.equal(invalid.status, 400);
  assert.equal(deckYamlEndpoint(undefined), undefined);
});

test("template preview variant identities cannot collide with display-label delimiters", () => {
  assert.notEqual(
    templatePreviewSlideId("a", "b · c"),
    templatePreviewSlideId("a · b", "c"),
  );
});

test("serve uses the shared review shell for deck targets", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(source, /runtimeDeck\) return <PreviewApp deckMode source=\{runtimeDeck\}/);
  assert.doesNotMatch(source, /runtimeDeck \? <DeckExport/);
});

test("bare serve uses a dedicated template gallery before opening the viewer", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(source, /params\.has\("gallery"\) \|\| \(!runtimeTemplate && !requestedTemplate\)/);
  assert.match(source, /<PreviewApp galleryHref="\?gallery" source=\{source\}/);
});

test("serve mounts the Agentation feedback toolbar inside the slide iframe, not the shell", () => {
  const mainSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.doesNotMatch(mainSource, /from "agentation"/);
  assert.doesNotMatch(mainSource, /<Agentation \/>/);
  assert.match(mainSource, /<FixedSlideCanvas documentRef=\{frameDocumentRef\} mountAgentation slide=\{activeSlide\}/);

  const canvasSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "fixed-slide-canvas.tsx"), "utf8");
  assert.match(canvasSource, /mountAgentation\?: boolean/);
  assert.match(canvasSource, /iframe-agentation-entry\.tsx/);

  const entrySource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "iframe-agentation-entry.tsx"), "utf8");
  assert.match(entrySource, /import \{ Agentation \} from "agentation";/);

  const exportDeckSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "deck-export.tsx"), "utf8");
  assert.doesNotMatch(exportDeckSource, /mountAgentation/);

  const exportSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "export-main.tsx"), "utf8");
  assert.doesNotMatch(exportSource, /agentation/i);
});

test("serve rejects deck and template targets together", () => {
  const result = spawnSync(process.execPath, [cli, "serve", "--deck", "sample", "--template", "swiss-modern", "--no-open"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Choose either --deck or --template/);
});

test("serve requires values for target and port options", () => {
  for (const option of ["--deck", "--template", "--port"]) {
    const result = spawnSync(process.execPath, [cli, "serve", option, "--no-open"], { cwd: projectRoot, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`${option} requires a value`));
  }
});

test("serve reports a missing template before starting Vite", () => {
  const result = spawnSync(process.execPath, [cli, "serve", "--template", "missing-preview-template", "--no-open"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /was not found in/);
});

test("a project template wins over the shipped default of the same name", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.engineRoot, "templates", "sample.template"), "Shipped");
  assert.equal(resolveTemplate(workspace, "sample").origin, "shipped");
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const selected = resolveTemplate(workspace, "sample");
  assert.equal(selected.manifest.displayName, "Mine");
  assert.equal(selected.origin, "project");
  assert.equal(selected.root, join(workspace.root, "templates", "sample.template"));
  const listed = listTemplates(workspace).find((entry) => entry.name === "sample");
  assert.equal(listed?.overridesShipped, true);
});

test("template resolution validates layout coverage", () => {
  const workspace = fixtureWorkspace();
  const root = join(workspace.engineRoot, "templates", "sample.template");
  writeTemplate(root, "Broken");
  writeFileSync(join(root, "layouts", "layout-index.json"), "{}\n");
  assert.throws(() => resolveTemplate(workspace, "sample"), /Missing layout index entry/);
});

test("template resolution rejects layout sources outside the template", () => {
  const workspace = fixtureWorkspace();
  const root = join(workspace.engineRoot, "templates", "sample.template");
  writeTemplate(root, "Unsafe");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "../../outside.tsx" } })}\n`);
  writeFileSync(join(root, "outside.tsx"), "export function SampleTitle() { return null; }\n");
  assert.throws(() => resolveTemplate(workspace, "sample"), /must stay inside layouts/);
});

test("resolution failures name both places a template could live", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "present.template"), "Present");
  assert.throws(
    () => resolveTemplate(workspace, "absent"),
    (error: Error) => /templates/.test(error.message) && /Available: present/.test(error.message),
  );
});

test("template manifests accept an optional CSS-safe deck class", () => {
  const manifest = fixtureManifest("Sample");
  manifest.deckClass = "sample-deck";
  assert.deepEqual(validateTemplateManifest(manifest), []);
  manifest.deckClass = "not valid";
  assert.match(validateTemplateManifest(manifest).join("\n"), /deckClass/);
});

test("template manifests validate declared layout and background variants", () => {
  const manifest = fixtureManifest("Sample");
  manifest.layoutVariants = { title: ["editorial-left", "black-hero"] };
  manifest.backgroundVariants = ["white", "orange", "black"];
  assert.deepEqual(validateTemplateManifest(manifest), []);

  manifest.layoutVariants = { title: ["editorial-left", "editorial-left"], quote: ["centered"] };
  manifest.backgroundVariants = ["white", "white"];
  const errors = validateTemplateManifest(manifest).join("\n");
  assert.match(errors, /layoutVariants\.title must not contain duplicates/);
  assert.match(errors, /unsupported slide type: quote/);
  assert.match(errors, /backgroundVariants must not contain duplicates/);
});

test("manifest deck rendering resolves components from the active template without template-name branches", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "vite-deck-plugin.ts"), "utf8");
  assert.match(source, /createManifestDeckSource/);
  assert.match(source, /loadTemplateDefinition\(templateRoot/);
  assert.match(source, /`\$\{templateName\}\.template`/);
  assert.doesNotMatch(source, /manifest\.template\?\.set\s*===/);
});

test("manifest deck sources use unified item metadata and expose overrides", () => {
  const dispatcher = readFileSync(join(projectRoot, "engine", "preview-app", "src", "manifest-deck-source.tsx"), "utf8");
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "content-schema-v2.tsx"), "utf8");
  const v1Source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "content-schema-v1.tsx"), "utf8");
  assert.match(dispatcher, /contentSchemaVersion/);
  assert.match(dispatcher, /createManifestDeckSourceV1/);
  assert.match(dispatcher, /createManifestDeckSourceV2/);
  assert.match(dispatcher, /Supported schema majors/);
  assert.match(v1Source, /FROZEN v1 parser/);
  assert.match(source, /items: \(\{ metadata \}\) => arrayMeta<SlideItem>\(metadata, "items"\)/);
  assert.match(source, /title: \(\{ metadata \}\) => textMeta\(metadata, "title"\)/);
  assert.match(source, /body: layoutPropReaders\.description/);
  assert.match(source, /recognizedSlideYamlKeys = new Set\(\["id", "type", "override", \.\.\.Object\.keys\(layoutPropReaders\)\]\)/);
  assert.match(source, /override: objectMeta<SlideOverride>\(metadata, "override"\)/);
  assert.match(source, /stats: \(\{ metadata \}\) => arrayMeta\(metadata, "stats"\)/);
  assert.match(source, /regionSeries: \(\{ metadata \}\) => arrayMeta\(metadata, "regionSeries"\)/);
  assert.match(source, /index: \(\{ metadata \}\) => numberMeta\(metadata, "index"\)/);
  assert.match(source, /commands: \(\{ metadata \}\) => arrayMeta<\{ prompt: string; output\?: string \}>\(metadata, "commands"\)/);
  assert.match(source, /flowSteps: \(\{ metadata \}\) => arrayMeta<\{ from: string; to: string; label: string; icon\?: string \}>\(metadata, "flowSteps"\)/);
  assert.match(source, /method: \(\{ metadata \}\) => textMeta\(metadata, "method"\)/);
  assert.match(source, /path: \(\{ metadata \}\) => textMeta\(metadata, "path"\)/);
  assert.match(source, /requestExample: \(\{ metadata \}\) => textMeta\(metadata, "requestExample"\)/);
  assert.match(source, /responseExample: \(\{ metadata \}\) => textMeta\(metadata, "responseExample"\)/);
  assert.match(source, /context: \(\{ metadata \}\) => textMeta\(metadata, "context"\)/);
  assert.match(source, /decision: \(\{ metadata \}\) => textMeta\(metadata, "decision"\)/);
  assert.match(source, /consequences: \(\{ metadata \}\) => arrayMeta<string>\(metadata, "consequences"\)/);
  assert.match(source, /collectMorphAnchors\(metadata\)/);
  assert.match(source, /parseYaml\(yamlText\)/);
  assert.doesNotMatch(source, /section\.title|On-Slide Text/);
  assert.doesNotMatch(source, /leftItems:|rightItems:|icon: textMeta|icons: arrayMeta/);
});

test("outline generation preserves the deck content schema when rewriting headings", () => {
  const source = readFileSync(join(projectRoot, "engine", "cli", "commands", "generation.ts"), "utf8");
  assert.match(source, /loaded\.manifest\.contentSchemaVersion/);
  assert.match(source, /legacySchema \? `## Slide 01: \$\{loaded\.manifest\.title\}`/);
  assert.match(source, /if \(!legacySchema\) sections\.sections\[0\] = setYamlField/);
});

test("export viewer exposes the toolbar visibility toggle without changing live preview", () => {
  const exportSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "deck-export.tsx"), "utf8");
  const exportStyles = readFileSync(join(projectRoot, "engine", "preview-app", "src", "export-shell.css"), "utf8");
  const previewSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(exportSource, /event\.shiftKey && event\.code === "KeyI"/);
  assert.match(exportSource, /onContextMenu=\{\(event\) =>/);
  assert.match(exportSource, /deck-controls\$\{controlsVisible \? "" : " is-hidden"\}/);
  assert.match(exportStyles, /\.deck-controls\.is-hidden\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?pointer-events:\s*none;/);
  assert.doesNotMatch(previewSource, /controlsVisible|onContextMenu/);
});

test("live preview keyboard navigation mirrors export and listens inside the slide iframe", () => {
  const previewSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(previewSource, /const target = event\.target as HTMLElement \| null/);
  assert.match(previewSource, /target\.tagName === "INPUT" \|\| target\.tagName === "SELECT"/);
  assert.match(previewSource, /target\.closest\?\.\("\[data-agentation-root\]"\)/);
  assert.match(previewSource, /\["ArrowRight", "ArrowDown", "PageDown", " "\]\.includes\(event\.key\)/);
  assert.match(previewSource, /\["ArrowLeft", "ArrowUp", "PageUp"\]\.includes\(event\.key\)/);
  assert.match(previewSource, /event\.key === "Home"/);
  assert.match(previewSource, /event\.key === "End"/);
  assert.match(previewSource, /const frameWindow = frameDocumentRef\.current\?\.defaultView \?\? null/);
  assert.match(previewSource, /window\.addEventListener\("keydown", onKeyDown\)/);
  assert.match(previewSource, /frameWindow\?\.addEventListener\("keydown", onKeyDown\)/);
  assert.match(previewSource, /frameWindow\?\.removeEventListener\("keydown", onKeyDown\)/);
});

test("live preview sidebar supports persisted resize and collapse without changing export", () => {
  const previewSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  const resizeSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "use-panel-resize.ts"), "utf8");
  const resizerSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "panel-resizer.tsx"), "utf8");
  const sidebarSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "slide-list-sidebar.tsx"), "utf8");
  const previewStyles = readFileSync(join(projectRoot, "engine", "preview-app", "src", "preview-shell.css"), "utf8");
  const exportSource = readFileSync(join(projectRoot, "engine", "preview-app", "src", "deck-export.tsx"), "utf8");
  const exportStyles = readFileSync(join(projectRoot, "engine", "preview-app", "src", "export-shell.css"), "utf8");

  assert.match(previewSource, /aideck\.preview\.sidebarWidth/);
  assert.match(previewSource, /aideck\.preview\.sidebarCollapsed/);
  assert.match(previewSource, /collapsed=\{sidebarCollapsed\}/);
  assert.match(resizeSource, /window\.addEventListener\("pointercancel", cleanup\)/);
  assert.match(resizeSource, /handle\.setPointerCapture\(pointerId\)/);
  assert.match(resizeSource, /handle\.releasePointerCapture\(pointerId\)/);
  assert.match(resizerSource, /aria-valuenow=\{collapsed \? undefined : width\}/);
  assert.match(resizerSource, /aria-valuemin=\{minWidth\}/);
  assert.match(resizerSource, /preview-sidebar-toggle/);
  assert.match(sidebarSource, /preview-sidebar\$\{collapsed \? " is-collapsed" : ""\}/);
  assert.match(sidebarSource, /preview-slide-type/);
  assert.match(previewStyles, /grid-template-columns: var\(--sidebar-width\) 8px minmax\(0, 1fr\)/);
  assert.match(previewStyles, /\.preview-sidebar\.is-collapsed \.preview-slide-type/);
  assert.doesNotMatch(exportSource, /preview-sidebar|sidebarWidth|sidebarCollapsed/);
  assert.doesNotMatch(exportStyles, /preview-sidebar|sidebarWidth|sidebarCollapsed/);
});

test("deck validation prefers its portable embedded template snapshot, then the project template, then the shipped default", () => {
  const source = readFileSync(join(projectRoot, "engine", "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs"), "utf8");
  const candidates = source.match(/const candidates = \[[\s\S]*?\];/);
  assert.ok(candidates, "expected an ordered candidate list");
  const order = [...candidates[0].matchAll(/path\.(?:join|resolve)\((.+?), "template-manifest\.json"\)/g)].map((match) => match[1]);
  assert.deepEqual(order, [`deckDir, "template"`, `projectRoot, "templates", bundle`, `projectRoot, pointer.engineRoot, "templates", bundle`]);
  assert.match(source, /candidates\.find\(/);
});

test("deck validation rejects an embedded template with the wrong identity", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-embedded-template-test-"));
  const deckRoot = join(root, "decks", "portable.deck");
  mkdirSync(join(deckRoot, "template"), { recursive: true });
  writeFileSync(join(deckRoot, "template", "template-manifest.json"), `${JSON.stringify(fixtureManifest("Wrong Template"), null, 2)}\n`);
  writeFileSync(join(deckRoot, "deck.json"), `${JSON.stringify({
    schema: "ai-deck-kit/deck@1.0.0",
    title: "Portable",
    slug: "portable",
    audience: "",
    goal: "",
    template: { set: "expected-template", version: "1.0.0" },
    slideTypeCatalog: "v1",
    blockCatalog: "v1",
    contentSchemaVersion: "1.0.0",
    outputMode: "react-and-static-html",
    status: "draft",
    defaults: { animation: "none", transition: "none" },
    slides: [{ id: "slide-01", type: "title", animation: "none" }],
  }, null, 2)}\n`);
  writeFileSync(join(deckRoot, "content.md"), `## Slide 01: Portable

\`\`\`yaml
id: "slide-01"
type: "title"
status: "draft"
intent: "Verify identity."
animation: "none"
transition: "none"
override:
  layout: "none"
  animation: "none"
  reason: ""
\`\`\`

### On-Slide Text

- Portable content.

### Visual Direction

Type-only.

### Speaker Notes

None.
`);
  const validator = join(projectRoot, "engine", "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs");
  const result = spawnSync(process.execPath, [validator, deckRoot], { cwd: projectRoot, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /template set mismatch, deck=expected-template, embedded=sample/);
});

test("deck validation resolves full Phosphor names and rejects unresolved icon values", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-icon-validation-test-"));
  try {
    const deckRoot = join(root, "decks", "icons.deck");
    const templateRoot = join(deckRoot, "template");
    mkdirSync(templateRoot, { recursive: true });
    const templateManifest = JSON.parse(readFileSync(join(projectRoot, "engine", "templates", "linear-dark.template", "template-manifest.json"), "utf8"));
    writeFileSync(join(templateRoot, "template-manifest.json"), `${JSON.stringify(templateManifest, null, 2)}\n`);
    writeFileSync(join(deckRoot, "deck.json"), `${JSON.stringify({
      schema: "ai-deck-kit/deck@1.0.0",
      title: "Icon validation",
      slug: "icons",
      audience: "",
      goal: "",
      template: { set: "linear-dark", version: templateManifest.templateVersion },
      slideTypeCatalog: "v2",
      blockCatalog: "v1",
      contentSchemaVersion: "1.0.0",
      outputMode: "react-and-static-html",
      status: "draft",
      defaults: { animation: "none", transition: "none" },
      slides: [{ id: "slide-01", type: "title" }],
    }, null, 2)}\n`);
    const validator = join(projectRoot, "engine", "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs");
    const content = (icon: string) => [
      "## Slide 01: Icon validation",
      "",
      "```yaml",
      'id: "slide-01"',
      'type: "title"',
      'status: "draft"',
      'intent: "Validate icon resolution."',
      'animation: "none"',
      `icons: ["${icon}"]`,
      "```",
      "",
      "### On-Slide Text",
      "",
      "- Icon",
      "",
      "### Visual Direction",
      "",
      "Icon.",
      "",
      "### Speaker Notes",
      "",
      "None.",
      "",
    ].join("\n");

    writeFileSync(join(deckRoot, "content.md"), content("alarm"));
    const valid = spawnSync(process.execPath, [validator, deckRoot], { cwd: projectRoot, encoding: "utf8" });
    assert.equal(valid.status, 0, valid.stderr);

    writeFileSync(join(deckRoot, "content.md"), content("not-a-real-phosphor-icon"));
    const invalid = spawnSync(process.execPath, [validator, deckRoot], { cwd: projectRoot, encoding: "utf8" });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Slide 01: icons value "not-a-real-phosphor-icon" is not a real Phosphor icon name/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a declared serif contributes both its roman and its italic styles", () => {
  // Italics were once missing because a single stylesheet was imported by hand. The catalog now
  // answers for a family as a whole, so the omission cannot come back one template at a time.
  assert.deepEqual(resolveFontImports(["newsreader"]), [
    "@fontsource-variable/newsreader/wght.css",
    "@fontsource-variable/newsreader/wght-italic.css",
  ]);
});

test("the export entry hardcodes no typeface beyond its own shell", () => {
  // Every other family belongs to a template's manifest. Hardcoding one here is how a template
  // ended up needing an engine edit to change its type.
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "export-main.tsx"), "utf8");
  const shell = ["@fontsource/inter/", "@fontsource/jetbrains-mono/"];
  const strays = [...source.matchAll(/@fontsource[^"]*/g)].map((match) => match[0]).filter((specifier) => !shell.some((prefix) => specifier.startsWith(prefix)));
  assert.deepEqual(strays, []);
});

test("new template scaffolds declare and scope their preview deck class", () => {
  const workspace = fixtureWorkspace();
  const root = createTemplate(workspace, "new-template");
  const manifest = JSON.parse(readFileSync(join(root, "template-manifest.json"), "utf8"));
  assert.equal(manifest.deckClass, "new-template-deck");
  assert.equal(manifest.slideTypeCatalog, "v2");
  const scaffoldCss = readFileSync(join(root, "design-system.css"), "utf8");
  assert.match(scaffoldCss, /^\.new-template-deck \{/);
  // The scaffold manifest advertises every element animation, so the tokens the engine reads
  // must be seeded with it — a bundle missing them renders no motion at all.
  assert.deepEqual(validateMotionTokens(root), []);
  assert.match(scaffoldCss, /--deck-motion-base:/);
  assert.match(scaffoldCss, /--deck-motion-ease:/);
  const guidance = readFileSync(join(root, "schema-guidance.md"), "utf8");
  assert.match(guidance, /template-manifest\.json/);
  assert.match(guidance, /layouts\/specs\/layout-contracts\.md/);
  assert.match(guidance, /engine\/schemas\/content-schema-guidance\.md/);
  assert.match(guidance, /never\nchange only a version field/);
});

// Templates in the wild predate both `supportedAnimations` and the --deck-motion-* tokens. Upgrading
// the engine leaves those bundles exactly where they are, so the new engine has to keep loading them
// or the upgrade breaks every command that renders or copies a template.
test("a template authored before supportedAnimations and the motion tokens still loads", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-legacy-template-"));
  mkdirSync(join(root, "layouts"), { recursive: true });
  writeFileSync(join(root, "template-manifest.json"), JSON.stringify({
    name: "legacy", displayName: "Legacy", templateVersion: "2.1.5", contentSchemaVersion: "2.0.0",
    slideTypeCatalog: "v1", runtime: ["react"], iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise", supportedSlideTypes: ["title"],
  }));
  writeFileSync(join(root, "design-system.css"), ".legacy-deck { color: red }\n");
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), JSON.stringify({ title: { component: "T", source: "title.tsx" } }));
  writeFileSync(join(root, "layouts", "title.tsx"), "export function T() { return null; }\n");

  assert.deepEqual(validateTemplateBundle(root), []);
  rmSync(root, { recursive: true, force: true });
});

// An absent declaration means the author never narrowed the set, and the engine implements them all.
test("a manifest without supportedAnimations reads as the full element-animation catalog", () => {
  const workspace = fixtureWorkspace();
  const root = join(workspace.root, "templates", "legacy.template");
  mkdirSync(join(root, "layouts"), { recursive: true });
  writeFileSync(join(root, "template-manifest.json"), JSON.stringify({
    name: "legacy", displayName: "Legacy", templateVersion: "2.1.5", contentSchemaVersion: "2.0.0",
    slideTypeCatalog: "v1", runtime: ["react"], iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise", supportedSlideTypes: ["title"],
  }));
  writeFileSync(join(root, "design-system.css"), ".legacy-deck { color: red }\n");
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), JSON.stringify({ title: { component: "T", source: "title.tsx" } }));
  writeFileSync(join(root, "layouts", "title.tsx"), "export function T() { return null; }\n");

  assert.deepEqual(resolveTemplate(workspace, "legacy").manifest.supportedAnimations, elementAnimationCatalogV1);
  rmSync(workspace.root, { recursive: true, force: true });
});

test("motion token validation rejects the way a template silently loses animation", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-motion-test-"));

  // A template that defines no motion tokens still animates on the engine's literal fallbacks, so
  // loading it is not a failure. Asking authors to declare the tokens belongs to the authoring
  // validator; refusing to load the bundle here only breaks templates written before the field.
  writeFileSync(join(root, "design-system.css"), ".sample-deck { color: red }\n");
  assert.deepEqual(validateMotionTokens(root), []);

  // A bridge pointing at tokens no CSS defines: the declaration is invalid at computed-value
  // time, so `animation` degrades to none with nothing in the console to say so.
  writeFileSync(join(root, "design-system.css"), ".sample-deck {\n  --deck-motion-base: var(--gone-base);\n  --deck-motion-ease: var(--gone-ease);\n}\n");
  const dangling = validateMotionTokens(root).join("\n");
  assert.match(dangling, /--deck-motion-base references --gone-base/);
  assert.match(dangling, /--deck-motion-ease references --gone-ease/);

  // A definition living in a sibling stylesheet still counts: the check reads the whole bundle.
  writeFileSync(join(root, "tokens.css"), ".sample-deck { --gone-base: 480ms; --gone-ease: ease; }\n");
  assert.deepEqual(validateMotionTokens(root), []);

  // A fallback chain is not a dangling reference: var(--a, var(--b)) reaches --b only when --a is
  // undefined, and a literal fallback resolves the declaration on its own.
  rmSync(join(root, "tokens.css"));
  writeFileSync(join(root, "design-system.css"), ".sample-deck {\n  --kept-base: 480ms;\n  --deck-motion-base: var(--kept-base, var(--gone-base));\n  --deck-motion-ease: var(--gone-ease, ease);\n}\n");
  assert.deepEqual(validateMotionTokens(root), []);

  rmSync(root, { recursive: true, force: true });
});

// The skill ships a standalone, dependency-free copy of this check so agents can run it without the
// built CLI. Nothing but this test stops the two from drifting apart.
test("the skill's standalone validator reports the same motion errors as the CLI", () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-motion-parity-"));
  cpSync(join(projectRoot, "engine", "templates", "swiss-modern.template"), root, { recursive: true });
  writeFileSync(join(root, "design-system.css"), ".swiss-deck {\n  --deck-motion-base: var(--gone-base);\n  --deck-motion-ease: var(--gone-ease);\n}\n");

  const cliErrors = validateMotionTokens(root);
  assert.notEqual(cliErrors.length, 0);

  const validator = join(projectRoot, "engine", "skills", "presentation-template-creation", "scripts", "validate-template-manifest.mjs");
  const skill = spawnSync(process.execPath, [validator, join(root, "template-manifest.json")], { encoding: "utf8" });
  const skillErrors = skill.stderr
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
    .filter((line) => /Missing motion token|which no CSS in this template defines/.test(line));
  assert.deepEqual(skillErrors, cliErrors);

  rmSync(root, { recursive: true, force: true });
});

test("the shipped templates define the motion tokens their bridge points at", () => {
  for (const name of ["linear-dark", "swiss-modern"]) {
    assert.deepEqual(validateMotionTokens(join(projectRoot, "engine", "templates", `${name}.template`)), [], name);
  }
});

test("upgrade rescues templates the old layout left inside the engine", () => {
  const workspace = fixtureWorkspace();
  declareShippedTemplates(workspace, ["shipped-default"]);
  writeTemplate(join(workspace.engineRoot, "templates", "shipped-default.template"), "Shipped Default", "shipped-default");
  writeTemplate(join(workspace.engineRoot, "templates", "my-template.template"), "Mine", "my-template");

  assert.deepEqual(migrateLegacyRegisteredTemplates(workspace), ["my-template"]);
  const moved = resolveTemplate(workspace, "my-template");
  assert.equal(moved.origin, "project");
  assert.equal(moved.root, join(workspace.root, "templates", "my-template.template"));
  // The shipped default stays put; the engine owns it and replaces it wholesale on upgrade.
  assert.equal(resolveTemplate(workspace, "shipped-default").origin, "shipped");
});

test("a shipped default cannot be version-bumped in place", () => {
  const workspace = fixtureWorkspace();
  declareShippedTemplates(workspace, ["locked"]);
  writeFileSync(workspace.pointerPath, `${JSON.stringify(workspace.pointer)}\n`);
  writeTemplate(join(workspace.engineRoot, "templates", "locked.template"), "Locked", "locked");
  const result = spawnSync(process.execPath, [cli, "template", "version", "locked", "--bump", "minor"], {
    cwd: workspace.root,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /shipped default and cannot be edited/);
});

test("Vite serves project template layouts, resolves shared primitives, and reloads manifest changes", { timeout: 30_000 }, async () => {
  const name = `serve-integration-${process.pid}`;
  const templateRoot = join(projectRoot, "templates", `${name}.template`);
  const engineRoot = join(projectRoot, "engine");
  const port = await availablePort();
  let output = "";
  let vite: ReturnType<typeof spawn> | undefined;

  try {
    mkdirSync(join(projectRoot, "templates"), { recursive: true });
    cpSync(join(engineRoot, "templates", "swiss-modern.template"), templateRoot, { recursive: true });
    const manifestPath = join(templateRoot, "template-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.name = name;
    manifest.displayName = "Integration Draft";
    const firstType = manifest.supportedSlideTypes[0];
    manifest.layoutVariants = Object.fromEntries(
      manifest.supportedSlideTypes.map((type: string) => [type, type === firstType ? ["variant-a", "variant-b"] : [`${type}-default`]]),
    );
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    vite = spawn(join(engineRoot, "node_modules", ".bin", "vite"), ["--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
      cwd: engineRoot,
      env: {
        ...process.env,
        AIDECK_TEMPLATE_PATH: templateRoot,
        AIDECK_ENGINE_ROOT: engineRoot,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    vite.stdout?.on("data", (chunk) => { output += chunk; });
    vite.stderr?.on("data", (chunk) => { output += chunk; });

    const baseUrl = `http://127.0.0.1:${port}`;
    await waitFor(async () => (await fetch(baseUrl)).ok, () => `Vite did not start:\n${output}`);
    const virtualUrl = `${baseUrl}/@id/__x00__virtual:aideck-deck`;
    const virtualSource = await (await fetch(virtualUrl)).text();
    assert.match(virtualSource, new RegExp(`templates/${name}\\.template`));
    assert.match(virtualSource, new RegExp(`${firstType} · variant-a`));
    assert.match(virtualSource, /layoutVariant: "variant-a"/);

    const sharedPath = join(templateRoot, "layouts", "react", "shared.tsx");
    const sharedUrl = new URL(`/@fs${sharedPath}`, baseUrl);
    const sharedSource = await (await fetch(sharedUrl)).text();
    assert.match(sharedSource, /engine\/primitives\/blocks\/index\.ts/);

    manifest.displayName = "Integration Draft Reloaded";
    delete manifest.layoutVariants;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await waitFor(
      async () => (await (await fetch(virtualUrl)).text()).includes("Integration Draft Reloaded"),
      () => `Vite did not reload the changed manifest:\n${output}`,
    );
    const reloadedSource = await (await fetch(virtualUrl)).text();
    assert.doesNotMatch(reloadedSource, /variant-a/);
    assert.match(reloadedSource, new RegExp(`type: "${firstType}"`));
  } finally {
    if (vite && vite.exitCode === null) {
      vite.kill("SIGTERM");
      await new Promise<void>((resolveExit) => vite?.once("exit", () => resolveExit()));
    }
    rmSync(templateRoot, { recursive: true, force: true });
  }
});

function fixtureWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "aideck-serve-test-"));
  const engineRoot = join(root, "engine");
  return {
    root,
    engineRoot,
    decksRoot: join(root, "decks"),
    pointerPath: join(root, "ai-deck-kit.json"),
    pointer: { engineRoot: "engine", decksRoot: "decks", engineVersion: "0.1.0" },
  };
}

function declareShippedTemplates(workspace: Workspace, shippedTemplates: string[]): void {
  mkdirSync(workspace.engineRoot, { recursive: true });
  writeFileSync(join(workspace.engineRoot, "engine.version.json"), `${JSON.stringify({ engineVersion: "0.1.0", shippedTemplates })}\n`);
}

function writeTemplate(root: string, displayName: string, name = "sample"): void {
  mkdirSync(join(root, "layouts"), { recursive: true });
  const manifest = fixtureManifest(displayName);
  manifest.name = name;
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), ".sample-deck { --deck-motion-ease: cubic-bezier(0.22, 1, 0.36, 1); --deck-motion-base: 480ms; }\n");
  writeFileSync(join(root, "animation-presets.css"), ".sample-enter {}\n");
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n\nUse Phosphor icons.\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "title.tsx" } }, null, 2)}\n`);
  writeFileSync(join(root, "layouts", "title.tsx"), "export function SampleTitle() { return null; }\n");
}

function fixtureManifest(displayName: string): TemplateManifest {
  return {
    name: "sample",
    displayName,
    templateVersion: "1.0.0",
    contentSchemaVersion: "1.0.0",
    slideTypeCatalog: "v1",
    runtime: ["react"],
    iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise",
    supportedAnimations: ["none", "gentle-rise"],
    supportedSlideTypes: ["title"],
  };
}

async function availablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not allocate a preview test port."));
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitFor(check: () => Promise<boolean>, error: () => string): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      // The server may still be starting or reloading.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(error());
}
