import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildServeViteArgs, parseServeArgs } from "../commands/output.ts";
import { createTemplate, listTemplates, migrateLegacyRegisteredTemplates, resolveTemplate, validateTemplateManifest, type TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";
import { resolveGeneratedTemplateImport, templatePreviewSlideId } from "../../preview-app/vite-deck-plugin.ts";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cli = join(projectRoot, "engine", "cli", "index.mjs");

test("serve help documents template selection and headless mode", () => {
  const output = execFileSync(process.execPath, [cli, "--help"], { cwd: projectRoot, encoding: "utf8" });
  assert.match(output, /serve \[<deck-id> \| deck <id> \| template <name>/);
  assert.match(output, /--no-open/);
});

test("serve normalizes gallery, deck, and template command forms", () => {
  assert.deepEqual(parseServeArgs(["serve"]), { open: true });
  assert.deepEqual(parseServeArgs(["serve", "vivimoon-website"]), { deck: "vivimoon-website", open: true });
  assert.deepEqual(parseServeArgs(["serve", "deck", "vivimoon-website"]), { deck: "vivimoon-website", open: true });
  assert.deepEqual(parseServeArgs(["serve", "--deck", "vivimoon-website"]), { deck: "vivimoon-website", open: true });
  assert.deepEqual(parseServeArgs(["serve", "template", "linear-dark"]), { open: true, template: "linear-dark" });
  assert.deepEqual(parseServeArgs(["serve", "--template", "linear-dark"]), { open: true, template: "linear-dark" });
});

test("serve validates ambiguous targets and forwards browser-open options", () => {
  assert.throws(() => parseServeArgs(["serve", "deck"]), /deck requires a value/);
  assert.throws(() => parseServeArgs(["serve", "unknown", "extra"]), /Unknown serve arguments/);
  assert.throws(
    () => parseServeArgs(["serve", "vivimoon-website", "--template", "linear-dark"]),
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

test("template preview variant identities cannot collide with display-label delimiters", () => {
  assert.notEqual(
    templatePreviewSlideId("a", "b · c"),
    templatePreviewSlideId("a · b", "c"),
  );
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

test("serve mounts the Agentation feedback toolbar alongside every preview route", () => {
  const source = readFileSync(join(projectRoot, "engine", "preview-app", "src", "main.tsx"), "utf8");
  assert.match(source, /import \{ Agentation \} from "agentation";/);
  assert.match(source, /<AppRouter \/>\s*\n\s*<Agentation \/>/);

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
