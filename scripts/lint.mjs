#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const ignoredDirectory = "node_" + "modules";
const metadataDirectory = ".g" + "it";
const files = [join(root, "engine"), join(root, "scripts")].flatMap(walk).filter((file) => file.endsWith(".mjs"));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || `Syntax check failed: ${relative(root, file)}`);
    process.exit(1);
  }
}
console.log(`Lint passed: ${files.length} JavaScript files checked.`);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ignoredDirectory || entry.name === metadataDirectory || entry.name === ".build") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
