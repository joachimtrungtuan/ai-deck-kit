#!/usr/bin/env node
// Fails when the committed CLI build does not match the CLI source.
//
// The compiled output in engine/cli/dist is tracked because Node cannot strip
// types under node_modules, so users run the committed build. That only stays
// true if nobody commits a source change without rebuilding — which is what
// this check enforces.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distribution = join("engine", "cli", "dist");

const build = spawnSync("npm", ["run", "build"], { cwd: repoRoot, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

const diff = spawnSync("git", ["status", "--porcelain", "--", distribution], { cwd: repoRoot, encoding: "utf8" });
if (diff.status !== 0) {
  console.error(diff.stderr.trim() || "Could not inspect git status.");
  process.exit(1);
}

if (diff.stdout.trim()) {
  console.error(`The committed CLI build is out of date with cli/*.ts:\n${diff.stdout.trimEnd()}`);
  console.error("\nRun 'npm run build' and commit the result alongside your source change.");
  process.exit(1);
}

console.log(`The committed CLI build matches the source in ${distribution}.`);
