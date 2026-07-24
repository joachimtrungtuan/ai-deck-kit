#!/usr/bin/env node
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const validator = join(root, "engine", "skills", "presentation-template-creation", "scripts", "validate-template-manifest.mjs");
for (const name of ["swiss-modern", "linear-dark"]) {
  const manifest = join(root, "engine", "templates", name, "template-manifest.json");
  const result = spawnSync(process.execPath, [validator, manifest], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("Template validators passed.");
