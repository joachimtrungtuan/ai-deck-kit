// Covers the promises the CLI makes about a deck's relationship to its template: what it froze,
// when it has drifted, what re-syncing changes, and what removal is allowed to do.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDeck } from "../lib/deck.ts";
import { deckDrift, retemplateDeck } from "../lib/deck-template-sync.ts";
import { resolveTemplate, type TemplateManifest } from "../lib/templates.ts";
import type { DeckManifest, Workspace } from "../lib/types.ts";

test("a new deck records which source its frozen snapshot came from", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const root = createDeck(workspace, "talk", "sample");
  const manifest = readManifest(root);
  assert.equal(manifest.template.origin, "project");
  assert.equal(manifest.template.version, "1.0.0");
  assert.ok(existsSync(join(root, "template", "template-manifest.json")));
  assert.equal(deckDrift(workspace, "talk.deck").state, "current");
});

test("editing the source template puts the deck behind, without touching the deck", () => {
  const workspace = fixtureWorkspace();
  const templateRoot = join(workspace.root, "templates", "sample.template");
  writeTemplate(templateRoot, "Mine");
  createDeck(workspace, "talk", "sample");
  bumpTemplate(templateRoot, "1.1.0");

  const drift = deckDrift(workspace, "talk.deck");
  assert.equal(drift.state, "behind");
  assert.equal(drift.detail, "1.0.0 → 1.1.0");
  assert.equal(readManifest(join(workspace.decksRoot, "talk.deck")).template.version, "1.0.0");
});

test("a deck whose template moved source is reported, not silently re-pointed", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  createDeck(workspace, "talk", "sample");
  // The user deletes their copy; a shipped default of the same name is all that is left.
  writeTemplate(join(workspace.engineRoot, "templates", "sample.template"), "Shipped");
  removeDirectory(join(workspace.root, "templates", "sample.template"));

  const drift = deckDrift(workspace, "talk.deck");
  assert.equal(drift.state, "source-switched");
  assert.match(drift.detail, /project → shipped/);
});

test("a deck whose template is gone reports source-missing", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  createDeck(workspace, "talk", "sample");
  removeDirectory(join(workspace.root, "templates", "sample.template"));
  assert.equal(deckDrift(workspace, "talk.deck").state, "source-missing");
});

test("re-syncing replaces the snapshot and records the new version and origin", () => {
  const workspace = fixtureWorkspace();
  const templateRoot = join(workspace.root, "templates", "sample.template");
  writeTemplate(templateRoot, "Mine");
  const deckRoot = createDeck(workspace, "talk", "sample");
  const contentBefore = readFileSync(join(deckRoot, "content.md"), "utf8");
  bumpTemplate(templateRoot, "2.0.0");

  const result = retemplateDeck(deckRoot, resolveTemplate(workspace, "sample"));
  assert.deepEqual([result.from, result.to, result.majorChange], ["1.0.0", "2.0.0", true]);
  const manifest = readManifest(deckRoot);
  assert.equal(manifest.template.version, "2.0.0");
  assert.equal(manifest.template.origin, "project");
  assert.equal(JSON.parse(readFileSync(join(deckRoot, "template", "template-manifest.json"), "utf8")).templateVersion, "2.0.0");
  // Re-syncing is a template operation; slide content is never rewritten behind the user's back.
  assert.equal(readFileSync(join(deckRoot, "content.md"), "utf8"), contentBefore);
  assert.equal(deckDrift(workspace, "talk.deck").state, "current");
});

test("re-syncing refuses a template that cannot render the deck's slide types", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const deckRoot = createDeck(workspace, "talk", "sample");
  const narrowRoot = join(workspace.root, "templates", "narrow.template");
  writeTemplate(narrowRoot, "Narrow", "narrow");
  const manifest = JSON.parse(readFileSync(join(narrowRoot, "template-manifest.json"), "utf8")) as TemplateManifest;
  manifest.supportedSlideTypes = ["quote"];
  manifest.layoutVariants = undefined;
  writeFileSync(join(narrowRoot, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(narrowRoot, "layouts", "layout-index.json"), `${JSON.stringify({ quote: { component: "SampleTitle", source: "title.tsx" } })}\n`);

  assert.throws(() => retemplateDeck(deckRoot, resolveTemplate(workspace, "narrow")), /does not support every slide type/);
  // The refusal must leave the deck exactly as it was.
  assert.equal(readManifest(deckRoot).template.set, "sample");
  assert.equal(JSON.parse(readFileSync(join(deckRoot, "template", "template-manifest.json"), "utf8")).name, "sample");
});

function readManifest(deckRoot: string): DeckManifest {
  return JSON.parse(readFileSync(join(deckRoot, "deck.json"), "utf8")) as DeckManifest;
}

function bumpTemplate(root: string, version: string): void {
  const manifestPath = join(root, "template-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  manifest.templateVersion = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function removeDirectory(target: string): void {
  rmSync(target, { recursive: true, force: true });
}

function fixtureWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "aideck-lifecycle-test-"));
  const engineRoot = join(root, "engine");
  mkdirSync(engineRoot, { recursive: true });
  writeFileSync(join(engineRoot, "engine.version.json"), `${JSON.stringify({ engineVersion: "0.1.0", shippedTemplates: [] })}\n`);
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
  const manifest: TemplateManifest = {
    name,
    displayName,
    templateVersion: "1.0.0",
    contentSchemaVersion: "1.0.0",
    slideTypeCatalog: "v1",
    runtime: ["react"],
    iconFamily: "phosphor-react",
    defaultAnimation: "gentle-rise",
    supportedSlideTypes: ["title"],
  };
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), `.${name}-deck {}\n`);
  writeFileSync(join(root, "animation-presets.css"), `.${name}-enter {}\n`);
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n\nUse Phosphor icons.\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "title.tsx" } }, null, 2)}\n`);
  writeFileSync(join(root, "layouts", "title.tsx"), "export function SampleTitle() { return null; }\n");
}
