// Covers the `verify`/`doctor` slide-type catalog check: general engine catalogs (v1/v2) and the
// documented named, versioned profile a template may declare for its own narrower use case
// (template-system.md, "Rules" item 3) must both pass; anything else must still be rejected.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { verifyWorkspace } from "../commands/verify.ts";
import { createDeck } from "../lib/deck.ts";
import type { TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";

const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));

test("a deck using its own template's named catalog profile is not flagged unsupported", async () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "clarity-courseware.template"), "clarity-courseware", "clarity-courseware-v1");
  createDeck(workspace, "lesson", "clarity-courseware");

  const report = await verifyWorkspace(workspace);
  assert.ok(
    !report.errors.some((error) => /unsupported slide-type catalog/.test(error)),
    `expected no catalog error, got: ${JSON.stringify(report.errors)}`,
  );
});

test("a catalog name that does not match the deck's own template is still rejected", async () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "sample", "someone-elses-v1");
  createDeck(workspace, "talk", "sample");

  const report = await verifyWorkspace(workspace);
  assert.ok(report.errors.some((error) => /unsupported slide-type catalog someone-elses-v1/.test(error)));
});

test("content schema verification rejects malformed versions", async () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "sample", "v1");
  const deckRoot = createDeck(workspace, "talk", "sample");
  const manifestPath = join(deckRoot, "deck.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  manifest.contentSchemaVersion = "1abc.0.0";
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const report = await verifyWorkspace(workspace);
  assert.ok(report.errors.some((error) => /talk\.deck: unsupported content schema 1abc\.0\.0/.test(error)));
});

test("verify accepts v2 decks created from both shipped templates", async () => {
  const root = mkdtempSync(join(tmpdir(), "aideck-shipped-v2-catalog-test-"));
  const workspace: Workspace = {
    root,
    engineRoot: join(projectRoot, "engine"),
    decksRoot: join(root, "decks"),
    pointerPath: join(root, "ai-deck-kit.json"),
    pointer: { engineRoot: join(projectRoot, "engine"), decksRoot: "decks", engineVersion: "1.1.0" },
  };
  try {
    mkdirSync(workspace.decksRoot, { recursive: true });
    for (const template of ["linear-dark", "swiss-modern"]) createDeck(workspace, `${template}-v2`, template);

    const report = await verifyWorkspace(workspace);
    assert.deepEqual(report.errors, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixtureWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "aideck-verify-catalog-test-"));
  const engineRoot = join(root, "engine");
  mkdirSync(engineRoot, { recursive: true });
  writeFileSync(
    join(engineRoot, "engine.version.json"),
    `${JSON.stringify({ engineVersion: "0.1.0", shippedTemplates: [], supportedContentSchemaMajors: [1, 2], supportedSlideTypeCatalogs: ["v1", "v2"] })}\n`,
  );
  return {
    root,
    engineRoot,
    decksRoot: join(root, "decks"),
    pointerPath: join(root, "ai-deck-kit.json"),
    pointer: { engineRoot: "engine", decksRoot: "decks", engineVersion: "0.1.0" },
  };
}

function writeTemplate(root: string, name: string, slideTypeCatalog: string): void {
  mkdirSync(join(root, "layouts"), { recursive: true });
  const manifest: TemplateManifest = {
    name,
    displayName: name,
    templateVersion: "1.0.0",
    contentSchemaVersion: "1.0.0",
    slideTypeCatalog,
    runtime: ["react"],
    iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise",
    supportedAnimations: ["none", "gentle-rise"],
    supportedSlideTypes: ["title"],
  };
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), `.${name}-deck { --deck-motion-ease: cubic-bezier(0.22, 1, 0.36, 1); --deck-motion-base: 480ms; }\n`);
  writeFileSync(join(root, "animation-presets.css"), `.${name}-enter {}\n`);
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n\nUse Phosphor icons.\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "title.tsx" } }, null, 2)}\n`);
  writeFileSync(join(root, "layouts", "title.tsx"), "export function SampleTitle() { return null; }\n");
}
