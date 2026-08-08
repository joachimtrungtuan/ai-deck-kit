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
  if (!packedFiles.has(manifest)) {
    console.error(`Release package is missing shipped template: ${manifest}`);
    process.exit(1);
  }
}

console.log("Template validators passed.");
console.log(`Release package contains all ${shippedTemplates.length} shipped .template bundles.`);
