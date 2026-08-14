// Covers the `verify`/`doctor` slide-type catalog check: general engine catalogs (v1/v2) and the
// documented named, versioned profile a template may declare for its own narrower use case
// (template-system.md, "Rules" item 3) must both pass; anything else must still be rejected.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyWorkspace } from "../commands/verify.ts";
import { createDeck } from "../lib/deck.ts";
import type { TemplateManifest } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";

test("a deck using its own template's named catalog profile is not flagged unsupported", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "clarity-courseware.template"), "clarity-courseware", "clarity-courseware-v1");
  createDeck(workspace, "lesson", "clarity-courseware");

  const report = verifyWorkspace(workspace);
  assert.ok(
    !report.errors.some((error) => /unsupported slide-type catalog/.test(error)),
    `expected no catalog error, got: ${JSON.stringify(report.errors)}`,
  );
});

test("a catalog name that does not match the deck's own template is still rejected", () => {
  const workspace = fixtureWorkspace();
  writeTemplate(join(workspace.root, "templates", "sample.template"), "sample", "someone-elses-v1");
  createDeck(workspace, "talk", "sample");

  const report = verifyWorkspace(workspace);
  assert.ok(report.errors.some((error) => /unsupported slide-type catalog someone-elses-v1/.test(error)));
});

function fixtureWorkspace(): Workspace {
  const root = mkdtempSync(join(tmpdir(), "aideck-verify-catalog-test-"));
  const engineRoot = join(root, "engine");
  mkdirSync(engineRoot, { recursive: true });
  writeFileSync(
    join(engineRoot, "engine.version.json"),
    `${JSON.stringify({ engineVersion: "0.1.0", shippedTemplates: [], supportedSlideTypeCatalogs: ["v1", "v2"] })}\n`,
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
    supportedSlideTypes: ["title"],
  };
  writeFileSync(join(root, "template-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, "design-system.css"), `.${name}-deck {}\n`);
  writeFileSync(join(root, "animation-presets.css"), `.${name}-enter {}\n`);
  writeFileSync(join(root, "icon-policy.md"), "# Icon policy\n\nUse Phosphor icons.\n");
  writeFileSync(join(root, "layouts", "layout-index.json"), `${JSON.stringify({ title: { component: "SampleTitle", source: "title.tsx" } }, null, 2)}\n`);
  writeFileSync(join(root, "layouts", "title.tsx"), "export function SampleTitle() { return null; }\n");
}
