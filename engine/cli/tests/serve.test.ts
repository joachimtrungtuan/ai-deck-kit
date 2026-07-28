import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createTemplate, getPreviewTemplate, getTemplate, registerTemplate, validateTemplateManifest, type TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cli = join(projectRoot, "engine", "cli", "index.mjs");

test("serve help documents template selection and headless mode", () => {
  const output = execFileSync(process.execPath, [cli, "--help"], { cwd: projectRoot, encoding: "utf8" });
  assert.match(output, /serve \[--deck <id> \| --template <name>\]/);
  assert.match(output, /--no-open/);
});

test("serve uses the shared review shell for deck targets", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(source, /runtimeDeck\) return <PreviewApp source=\{runtimeDeck\}/);
  assert.doesNotMatch(source, /runtimeDeck \? <DeckExport/);
});

test("bare serve uses a dedicated template gallery before opening the viewer", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(source, /if \(showGallery\) return <TemplateGallery sources=\{sources\}/);
  assert.match(source, /<PreviewApp galleryHref="\?gallery" source=\{source\}/);
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
  assert.match(result.stderr, /was not found as a draft or installed template/);
});

test("preview template resolution prefers a valid user draft", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.engineRoot, "templates", "sample.template"), "Installed");
  assert.equal(getPreviewTemplate(workspace, "sample").manifest.displayName, "Installed");
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Draft");
  const selected = getPreviewTemplate(workspace, "sample");
  assert.equal(selected.manifest.displayName, "Draft");
  assert.equal(selected.root, join(workspace.root, "templates", "sample.template"));
});

test("preview template resolution validates layout coverage", () => {
  const workspace = fixtureWorkspace();
  const root = join(workspace.engineRoot, "templates", "sample.template");
  writeTemplate(root, "Broken");
  writeFileSync(join(root, "layouts", "layout-index.json"), "{}\n");
  assert.throws(() => getPreviewTemplate(workspace, "sample"), /Missing layout index entry/);
});

test("preview template resolution rejects layout sources outside the template", () => {
  const workspace = fixtureWorkspace();
  const root = join(workspace.engineRoot, "templates", "sample.template");
  writeTemplate(root, "Unsafe");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "../../outside.tsx" } })}\n`);
  writeFileSync(join(root, "outside.tsx"), "export function SampleTitle() { return null; }\n");
  assert.throws(() => getPreviewTemplate(workspace, "sample"), /must stay inside layouts/);
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

test("deck validation prefers its portable embedded template snapshot", () => {
  const source = readFileSync(join(projectRoot, "engine", "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs"), "utf8");
  assert.match(source, /embeddedTemplateManifestPath/);
  assert.match(source, /fs\.existsSync\(embeddedTemplateManifestPath\)/);
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

test("standalone export loads both Newsreader styles", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "export-main.tsx"), "utf8");
  assert.match(source, /@fontsource-variable\/newsreader\/wght\.css/);
  assert.match(source, /@fontsource-variable\/newsreader\/wght-italic\.css/);
});

test("new template scaffolds declare and scope their preview deck class", () => {
  const workspace = fixtureWorkspace();
  const root = createTemplate(workspace, "new-template");
  const manifest = JSON.parse(readFileSync(join(root, "template-manifest.json"), "utf8"));
  assert.equal(manifest.deckClass, "new-template-deck");
  assert.match(readFileSync(join(root, "design-system.css"), "utf8"), /^\.new-template-deck \{/);
});

test("template registration preserves the bundle suffix", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "registered-template.template"), "Registered Template", "registered-template");
  const installed = registerTemplate(workspace, "registered-template");
  assert.equal(installed, join(workspace.engineRoot, "templates", "registered-template.template"));
  assert.equal(getTemplate(workspace, "registered-template").root, installed);
});

test("Vite serves draft layouts, resolves shared primitives, and reloads manifest changes", { timeout: 30_000 }, async () => {
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

    const sharedPath = join(templateRoot, "layouts", "react", "shared.tsx");
    const sharedUrl = new URL(`/@fs${sharedPath}`, baseUrl);
    const sharedSource = await (await fetch(sharedUrl)).text();
    assert.match(sharedSource, /engine\/primitives\/blocks\/index\.ts/);

    manifest.displayName = "Integration Draft Reloaded";
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await waitFor(
      async () => (await (await fetch(virtualUrl)).text()).includes("Integration Draft Reloaded"),
      () => `Vite did not reload the changed manifest:\n${output}`,
    );
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

function writeTemplate(root: string, displayName: string, name = "sample"): void {
  mkdirSync(join(root, "layouts"), { recursive: true });
  const manifest = fixtureManifest(displayName);
  manifest.name = name;
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), ".sample-deck {}\n");
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
