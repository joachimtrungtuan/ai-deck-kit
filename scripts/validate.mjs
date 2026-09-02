#!/usr/bin/env node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const validator = join(root, "engine", "skills", "presentation-template-creation", "scripts", "validate-template-manifest.mjs");
const shippedTemplates = ["swiss-modern", "linear-dark"];
for (const name of shippedTemplates) {
  const manifest = join(root, "engine", "templates", `${name}.template`, "template-manifest.json");
  const result = spawnSync(process.execPath, [validator, manifest], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Conformance fixture: the shipped showcase deck must validate from its own
// bundle (embedded template snapshot included) on every CI run.
const deckValidator = join(root, "engine", "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs");
const deckResult = spawnSync(process.execPath, [deckValidator, join(root, "engine", "examples", "showcase.deck")], { stdio: "inherit" });
if (deckResult.status !== 0) process.exit(deckResult.status ?? 1);

const npmCache = mkdtempSync(join(tmpdir(), "aideck-package-validation-"));
const pack = spawnSync("npm", ["pack", "--json", "--dry-run", "--ignore-scripts"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: npmCache },
});
rmSync(npmCache, { recursive: true, force: true });
if (pack.status !== 0) {
  process.stderr.write(pack.stderr);
  process.exit(pack.status ?? 1);
}
const report = JSON.parse(pack.stdout);
const packageReport = Array.isArray(report) ? report[0] : report["ai-deck-kit"] ?? report;
const packedFiles = new Set(packageReport.files.map((file) => file.path));
for (const name of shippedTemplates) {
  const manifest = `engine/templates/${name}.template/template-manifest.json`;
  const guidance = `engine/templates/${name}.template/schema-guidance.md`;
  for (const required of [manifest, guidance]) {
    if (!packedFiles.has(required)) {
      console.error(`Release package is missing shipped template file: ${required}`);
      process.exit(1);
    }
  }
}
for (const required of [
  "engine/schemas/content-schema-guidance.md",
  "engine/skills/content-schema-migration/SKILL.md",
  "engine/examples/showcase.deck/deck.json",
  "engine/examples/showcase.deck/content.md",
  "engine/examples/showcase.deck/assets/station-ridge.svg",
]) {
  if (!packedFiles.has(required)) {
    console.error(`Release package is missing schema authority: ${required}`);
    process.exit(1);
  }
}

console.log("Template validators passed.");
console.log(`Release package contains engine guidance, migration skill, and all ${shippedTemplates.length} shipped .template bundles with local guidance.`);
