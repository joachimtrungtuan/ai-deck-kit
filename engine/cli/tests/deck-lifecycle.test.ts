// Covers the promises the CLI makes about a deck's relationship to its template: what it froze,
// when it has drifted, what re-syncing changes, and what removal is allowed to do.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { createDeck, parseSections, readDeck, slideContent } from "../lib/deck.ts";
import { deckDrift, retemplateDeck } from "../lib/deck-template-sync.ts";
import { inspectSchemaGuidance, syncSchemaGuidance } from "../lib/schema-guidance.ts";
import { parseGuidanceSelection } from "../commands/guidance.ts";
import { addSlide, moveSlide } from "../commands/presentation.ts";
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
  const guidance = readFileSync(join(root, "schema-guidance.md"), "utf8");
  assert.match(guidance, /content schema `1\.0\.0`/);
  assert.match(guidance, /Template set: `sample`/);
  assert.match(guidance, /Schema migration is explicit and user-controlled/);
  assert.match(guidance, /aideck upgrade.*does not rewrite/s);
  const content = readFileSync(join(root, "content.md"), "utf8");
  assert.match(content, /^## Slide 01: Talk$/m);
  assert.match(content, /^icons: \[\]$/m);
  assert.match(content, /### On-Slide Text/);
  assert.equal(parseSections(content).sections.length, 1);
  const escaped = slideContent({ id: "slide-02", type: "title", file: "content.md#slide-02" }, 'A "quoted" title\nwith a new line', "2.0.0");
  assert.match(escaped, /title: "A \\"quoted\\" title\\nwith a new line"/);
  assert.equal(deckDrift(workspace, "talk.deck").state, "current");
});

test("a new deck inherits the template content schema version", () => {
  const workspace = fixtureWorkspace();
  const templateRoot = join(workspace.root, "templates", "v2-template.template");
  writeTemplate(templateRoot, "V2 template", "v2-template");
  const manifestPath = join(templateRoot, "template-manifest.json");
  const templateManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  templateManifest.contentSchemaVersion = "2.0.0";
  writeFileSync(manifestPath, `${JSON.stringify(templateManifest, null, 2)}\n`);

  const deckRoot = createDeck(workspace, "talk", "v2-template");
  assert.equal(readManifest(deckRoot).contentSchemaVersion, "2.0.0");
  assert.match(readFileSync(join(deckRoot, "schema-guidance.md"), "utf8"), /content schema `2\.0\.0`/);
  const content = readFileSync(join(deckRoot, "content.md"), "utf8");
  assert.match(content, /^## Slide 01 \(slide-01\)$/m);
  assert.match(content, /^title: "Talk"$/m);
  assert.doesNotMatch(content, /### On-Slide Text|^icons:/m);
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
  assert.match(readFileSync(join(deckRoot, "schema-guidance.md"), "utf8"), /Template version: `2\.0\.0`/);
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

test("re-syncing refuses a template on an older content-schema major", () => {
  const workspace = fixtureWorkspace();
  const v2Root = join(workspace.root, "templates", "v2.template");
  writeTemplate(v2Root, "V2", "v2");
  const v2ManifestPath = join(v2Root, "template-manifest.json");
  const v2Manifest = JSON.parse(readFileSync(v2ManifestPath, "utf8")) as TemplateManifest;
  v2Manifest.contentSchemaVersion = "2.0.0";
  writeFileSync(v2ManifestPath, `${JSON.stringify(v2Manifest, null, 2)}\n`);
  const deckRoot = createDeck(workspace, "talk", "v2");

  const v1Root = join(workspace.root, "templates", "v1.template");
  writeTemplate(v1Root, "V1", "v1");
  assert.throws(
    () => retemplateDeck(deckRoot, resolveTemplate(workspace, "v1")),
    /same content-schema major|explicit agent-led schema migration/,
  );
  assert.equal(readManifest(deckRoot).template.set, "v2");
  assert.equal(JSON.parse(readFileSync(join(deckRoot, "template", "template-manifest.json"), "utf8")).name, "v2");
});

test("guidance sync backfills legacy templates and refreshes stale deck guidance idempotently", () => {
  const workspace = fixtureWorkspace();
  mkdirSync(join(workspace.engineRoot, "schemas"), { recursive: true });
  writeFileSync(join(workspace.engineRoot, "schemas", "content-schema-guidance.md"), "# Engine guidance\n");
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const deckRoot = createDeck(workspace, "talk", "sample");
  writeFileSync(join(deckRoot, "schema-guidance.md"), "stale\n");

  const before = inspectSchemaGuidance(workspace);
  assert.equal(before.find((entry) => entry.level === "template")?.state, "missing");
  assert.equal(before.find((entry) => entry.level === "deck")?.state, "stale");

  syncSchemaGuidance(workspace);
  const after = inspectSchemaGuidance(workspace);
  assert.ok(after.every((entry) => entry.state === "current"));
  const templateGuidance = readFileSync(join(workspace.root, "templates", "sample.template", "schema-guidance.md"), "utf8");
  const deckGuidance = readFileSync(join(deckRoot, "schema-guidance.md"), "utf8");
  syncSchemaGuidance(workspace);
  assert.equal(readFileSync(join(workspace.root, "templates", "sample.template", "schema-guidance.md"), "utf8"), templateGuidance);
  assert.equal(readFileSync(join(deckRoot, "schema-guidance.md"), "utf8"), deckGuidance);
});

function readManifest(deckRoot: string): DeckManifest {
  return JSON.parse(readFileSync(join(deckRoot, "deck.json"), "utf8")) as DeckManifest;
}

test("moving a slide cascades numeric ids to match its new position", () => {
  const workspace = fixtureWorkspace();
  const templateRoot = join(workspace.root, "templates", "v2-template.template");
  writeTemplate(templateRoot, "V2 template", "v2-template");
  const manifestPath = join(templateRoot, "template-manifest.json");
  const templateManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  templateManifest.contentSchemaVersion = "2.0.0";
  writeFileSync(manifestPath, `${JSON.stringify(templateManifest, null, 2)}\n`);
  const root = createDeck(workspace, "talk", "v2-template");

  addSlide(readDeck(workspace, "talk"), workspace, "slide-02", "title");
  addSlide(readDeck(workspace, "talk"), workspace, "slide-03", "title");
  addSlide(readDeck(workspace, "talk"), workspace, "slide-04", "title");
  moveSlide(readDeck(workspace, "talk"), "slide-04", 2);

  const manifest = readManifest(root);
  assert.deepEqual(manifest.slides.map((slide) => slide.id), ["slide-01", "slide-02", "slide-03", "slide-04"]);
  assert.deepEqual(manifest.slides.map((slide) => slide.file), ["content.md#slide-01", "content.md#slide-02", "content.md#slide-03", "content.md#slide-04"]);

  const { sections } = parseSections(readFileSync(join(root, "content.md"), "utf8"));
  assert.equal(sections.length, 4);
  assert.match(sections[0], /^## Slide 01 \(slide-01\)/);
  assert.match(sections[1], /^## Slide 02 \(slide-02\)\n[\s\S]*id: "slide-02"[\s\S]*title: "Slide 04"/);
  assert.match(sections[2], /^## Slide 03 \(slide-03\)[\s\S]*id: "slide-03"/);
  assert.match(sections[3], /^## Slide 04 \(slide-04\)[\s\S]*id: "slide-04"/);
});

test("a custom (non-numeric) slide id is left alone by a reorder", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const root = createDeck(workspace, "talk", "sample");

  addSlide(readDeck(workspace, "talk"), workspace, "slide-02", "title");
  addSlide(readDeck(workspace, "talk"), workspace, "slide-summary", "title", "slide-02");
  moveSlide(readDeck(workspace, "talk"), "slide-summary", 1);

  assert.deepEqual(readManifest(root).slides.map((slide) => slide.id), ["slide-summary", "slide-02", "slide-03"]);
});

test("targeted guidance sync isolates bundles and preserves previous guidance", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "Mine");
  const first = createDeck(workspace, "first", "sample");
  const second = createDeck(workspace, "second", "sample");
  writeFileSync(join(first, "schema-guidance.md"), "Custom rules\n");
  writeFileSync(join(second, "schema-guidance.md"), "Other rules\n");
  syncSchemaGuidance(workspace, { level: "deck", name: "first" });
  assert.equal(readFileSync(join(first, "schema-guidance.md.backup"), "utf8"), "Custom rules\n");
  assert.equal(readFileSync(join(second, "schema-guidance.md"), "utf8"), "Other rules\n");
  assert.equal(existsSync(join(workspace.root, "templates", "sample.template", "schema-guidance.md")), false);
  assert.throws(() => syncSchemaGuidance(workspace, { level: "deck", name: "missing" }), /No project deck/);
  assert.deepEqual(parseGuidanceSelection(["--template", "sample"]), { level: "template", name: "sample" });
  for (const args of [["--deck"], ["--unknown", "first"], ["--deck", "../first"], ["--deck", "first", "--template", "sample"]]) {
    assert.throws(() => parseGuidanceSelection(args), /Choose exactly one/);
  }
});

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
  after(() => rmSync(root, { recursive: true, force: true }));
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
    supportedAnimations: ["none", "gentle-rise"],
    supportedSlideTypes: ["title"],
  };
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), `.${name}-deck {}\n`);
  writeFileSync(join(root, "animation-presets.css"), `.${name}-enter {}\n`);
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n\nUse Phosphor icons.\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "title.tsx" } }, null, 2)}\n`);
  writeFileSync(join(root, "layouts", "title.tsx"), "export function SampleTitle() { return null; }\n");
}
