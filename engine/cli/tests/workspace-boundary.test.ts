// The boundary an installed project has to hold: template work inside templates/{name}.template,
// deck words inside decks/{slug}.deck, and nothing at all inside the engine. `aideck verify` states
// it for any agent; the Claude hooks enforce it at the moment of the write and again when the agent
// stops. Both halves are covered here because they are one promise.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { verifyWorkspace } from "../commands/verify.ts";
import { createDeck } from "../lib/deck.ts";
import { installClaudeEngineGuard } from "../lib/claude-engine-guard.ts";
import { installClaudeHook, isClaudeHookRegistered } from "../lib/claude-hooks.ts";
import { installClaudeVerifyHook } from "../lib/claude-verify-hook.ts";
import { writeEngineIntegrityManifest } from "../lib/engine-integrity.ts";
import { templateSourceErrors } from "../lib/template-source-syntax.ts";
import { writeJson } from "../lib/fs.ts";
import type { TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";

const ENGINE_ROOT = join(import.meta.dirname, "..", "..");

test("a workspace whose edits all landed in the right package verifies", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"));
  createDeck(workspace, "talk", "sample");

  const report = verifyWorkspace(workspace);
  assert.deepEqual(report.errors, []);
  assert.equal(report.templates, 1);
  assert.equal(report.decks, 1);
});

test("a template edited inside a deck's frozen copy is named as a cross-edit", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"));
  const deckRoot = createDeck(workspace, "talk", "sample");
  // The tempting shortcut: change the layout where the deck renders from.
  writeFileSync(join(deckRoot, "template", "layouts", "title.tsx"), "export function SampleTitle() { return null; } // tweaked\n");

  const report = verifyWorkspace(workspace);
  assert.equal(report.errors.length, 1);
  assert.match(report.errors[0], /talk\.deck\/template\/layouts\/title\.tsx/);
  assert.match(report.errors[0], /templates\/sample\.template/);
  assert.match(report.errors[0], /aideck deck retemplate talk/);
});

test("a snapshot version bumped inside the deck is refused, not reported as drift", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"));
  const deckRoot = createDeck(workspace, "talk", "sample");
  // Edited in place and given a version the source template never published.
  bumpTemplate(join(deckRoot, "template"), "1.1.0");
  recordDeckTemplateVersion(deckRoot, "1.1.0");

  const report = verifyWorkspace(workspace);
  assert.deepEqual(report.notes, []);
  assert.equal(report.errors.length, 1);
  assert.match(report.errors[0], /never inside a deck/);
});

test("files loose beside the bundles are reported", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"));
  createDeck(workspace, "talk", "sample");
  writeFileSync(join(workspace.root, "templates", "hero.tsx"), "export function Hero() { return null; }\n");
  writeFileSync(join(workspace.decksRoot, "outline.md"), "# Outline\n");

  const errors = verifyWorkspace(workspace).errors;
  assert.equal(errors.length, 2);
  assert.match(errors[0], /templates\/: hero\.tsx/);
  assert.match(errors[1], /decks\/: outline\.md/);
});

test("an edited engine is reported once an installer has recorded one", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.engineRoot, "templates", "sample.template"));
  writeEngineIntegrityManifest(workspace.engineRoot);
  writeFileSync(join(workspace.engineRoot, "templates", "sample.template", "design-system.css"), ".sample-deck { color: red }\n");

  const errors = verifyWorkspace(workspace).errors;
  assert.equal(errors.length, 1);
  assert.match(errors[0], /installed engine has been edited/);
  assert.match(errors[0], /design-system\.css/);
});

test("an engine with no integrity manifest is not checked — that is the kit's own repository", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.engineRoot, "templates", "sample.template"));
  writeFileSync(join(workspace.engineRoot, "templates", "sample.template", "design-system.css"), ".sample-deck { color: red }\n");

  assert.deepEqual(verifyWorkspace(workspace).errors, []);
});

test("a layout that stopped parsing fails the template check", () => {
  const bundleRoot = join(mkdtempSync(join(tmpdir(), "aideck-boundary-test-")), "sample.template");
  writeTemplate(bundleRoot);
  writeFileSync(join(bundleRoot, "layouts", "title.tsx"), "export function SampleTitle() { return <div>;\n");

  const errors = templateSourceErrors(bundleRoot, ENGINE_ROOT);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^layouts\/title\.tsx: /);
});

test("the write guard refuses the deck files the CLI owns and allows the deck's words", () => {
  const workspace = installedFixture();
  const guard = installClaudeEngineGuard(mkdtempSync(join(tmpdir(), "aideck-claude-home-"))).hookPath;
  const deckRoot = join(workspace.decksRoot, "talk.deck");

  const manifest = runHook(guard, { tool_name: "Edit", tool_input: { file_path: join(deckRoot, "deck.json") } });
  assert.equal(manifest.status, 2);
  assert.match(manifest.output, /deck manifest, maintained by the CLI/);

  const snapshot = runHook(guard, { tool_name: "Write", tool_input: { file_path: join(deckRoot, "template", "layouts", "title.tsx") } });
  assert.equal(snapshot.status, 2);
  assert.match(snapshot.output, /aideck deck retemplate talk/);

  const generated = runHook(guard, { tool_name: "Write", tool_input: { file_path: join(deckRoot, ".build", "index.html") } });
  assert.equal(generated.status, 2);

  const engine = runHook(guard, { tool_name: "Edit", tool_input: { file_path: join(workspace.engineRoot, "preview-app", "src", "main.tsx") } });
  assert.equal(engine.status, 2);
  assert.match(engine.output, /replaced wholesale/);

  for (const owned of [join(deckRoot, "content.md"), join(deckRoot, "assets", "chart.png"), join(workspace.root, "templates", "sample.template", "layouts", "title.tsx")]) {
    assert.equal(runHook(guard, { tool_name: "Write", tool_input: { file_path: owned } }).status, 0, owned);
  }
});

test("the write guard stays inert in a project no installer touched", () => {
  const workspace = fixtureWorkspace();
  writeJson(workspace.pointerPath, workspace.pointer);
  const guard = installClaudeEngineGuard(mkdtempSync(join(tmpdir(), "aideck-claude-home-"))).hookPath;

  assert.equal(runHook(guard, { tool_name: "Edit", tool_input: { file_path: join(workspace.engineRoot, "engine.version.json") } }).status, 0);
});

test("the verifier hook reports what the workspace CLI found, and exits so the agent must fix it", () => {
  const workspace = installedFixture();
  stubEngineCli(workspace.engineRoot, `console.log("decks/: outline.md — everything here belongs inside a *.deck bundle.");\nprocess.exit(1);\n`);
  const hook = installClaudeVerifyHook(mkdtempSync(join(tmpdir(), "aideck-claude-home-"))).hookPath;

  const result = runHook(hook, { cwd: workspace.root });
  assert.equal(result.status, 2);
  assert.match(result.output, /does not check out after this pass/);
  assert.match(result.output, /outline\.md/);
});

test("the verifier hook stands down at a stop that already followed one", () => {
  const workspace = installedFixture();
  stubEngineCli(workspace.engineRoot, `process.exit(1);\n`);
  const hook = installClaudeVerifyHook(mkdtempSync(join(tmpdir(), "aideck-claude-home-"))).hookPath;

  // Without this the hook would block the stop it caused, and the two would trade turns forever.
  const result = runHook(hook, { cwd: workspace.root, stop_hook_active: true });
  assert.equal(result.status, 0);
  assert.equal(result.output, "");
  assert.equal(runHook(hook, { cwd: workspace.root }).status, 2);
});

test("registering a hook again refreshes the script but leaves settings.json alone", () => {
  const claudeHome = mkdtempSync(join(tmpdir(), "aideck-claude-home-"));
  writeJson(join(claudeHome, "settings.json"), { hooks: { Stop: [{ hooks: [{ type: "command", command: "node /elsewhere/mine.mjs" }] }] } });

  assert.equal(installClaudeHook({ claudeHome, event: "Stop", file: "sample.mjs", script: "// first\n" }).status, "installed");
  const second = installClaudeHook({ claudeHome, event: "Stop", file: "sample.mjs", script: "// second\n" });

  assert.equal(second.status, "unchanged");
  assert.equal(readFileSync(second.hookPath, "utf8"), "// second\n");
  assert.equal(isClaudeHookRegistered(claudeHome, "Stop", "sample.mjs"), true);
  const registered = JSON.parse(readFileSync(second.settingsPath, "utf8")).hooks.Stop as { hooks: { command: string }[] }[];
  assert.equal(registered.length, 2);
  assert.equal(registered[0].hooks[0].command, "node /elsewhere/mine.mjs");
});

function runHook(hookPath: string, payload: unknown): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [hookPath], { input: JSON.stringify(payload), encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

/** A workspace as an installer leaves it: pointer on disk, integrity manifest written, one deck. */
function installedFixture(): Workspace {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"));
  createDeck(workspace, "talk", "sample");
  writeJson(workspace.pointerPath, workspace.pointer);
  writeEngineIntegrityManifest(workspace.engineRoot);
  return workspace;
}

function stubEngineCli(engineRoot: string, body: string): void {
  mkdirSync(join(engineRoot, "cli"), { recursive: true });
  writeFileSync(join(engineRoot, "cli", "index.mjs"), body);
}

function recordDeckTemplateVersion(deckRoot: string, version: string): void {
  const manifestPath = join(deckRoot, "deck.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { template: { version: string } };
  manifest.template.version = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function bumpTemplate(root: string, version: string): void {
  const manifestPath = join(root, "template-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  manifest.templateVersion = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function fixtureWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "aideck-boundary-test-"));
  const engineRoot = join(root, "engine");
  mkdirSync(engineRoot, { recursive: true });
  writeFileSync(join(engineRoot, "engine.version.json"), `${JSON.stringify({ engineVersion: "0.1.0", shippedTemplates: [] })}\n`);
  // Stands in for the installed preview runtime, which verify expects to find.
  mkdirSync(join(engineRoot, "node" + "_modules", ".bin"), { recursive: true });
  writeFileSync(join(engineRoot, "node" + "_modules", ".bin", "vite"), "");
  mkdirSync(join(root, "decks"), { recursive: true });
  return {
    root,
    engineRoot,
    decksRoot: join(root, "decks"),
    pointerPath: join(root, "ai-deck-kit.json"),
    pointer: { engineRoot: "engine", decksRoot: "decks", engineVersion: "0.1.0" },
  };
}

function writeTemplate(root: string, name = "sample"): void {
  mkdirSync(join(root, "layouts"), { recursive: true });
  const manifest: TemplateManifest = {
    name,
    displayName: "Sample",
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
