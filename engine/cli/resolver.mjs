#!/usr/bin/env node
// ai-deck-kit-resolver-shim
// Resolves the nearest AI Deck Kit workspace and runs THAT workspace's engine.
// Contains no toolkit logic and no pinned version, so one registration serves
// every project and upgrading a project's engine needs no re-registration.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

let directory = process.cwd();
let pointer = "";
while (true) {
  const candidate = join(directory, "ai-deck-kit.json");
  if (existsSync(candidate)) {
    pointer = candidate;
    break;
  }
  const parent = dirname(directory);
  if (parent === directory) break;
  directory = parent;
}

if (!pointer) {
  console.error("No AI Deck Kit workspace found here.");
  console.error("");
  console.error("The 'aideck' command works inside a folder that has been set up with the kit.");
  console.error("Either move into your presentation project, or set one up here with:");
  console.error("  npx github:joachimtrungtuan/ai-deck-kit init --here");
  process.exit(1);
}

let declared;
try {
  declared = JSON.parse(readFileSync(pointer, "utf8"));
} catch (error) {
  console.error(`Could not read ai-deck-kit.json at ${pointer}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
if (typeof declared.engineRoot !== "string") {
  console.error(`Could not read ai-deck-kit.json at ${pointer}`);
  console.error('It has no "engineRoot" entry. Restore the file from version control, or reinstall the kit in this project.');
  process.exit(1);
}

const engineRoot = resolve(directory, declared.engineRoot);
const cli = join(engineRoot, "cli", "index.mjs");
if (!existsSync(cli)) {
  console.error(`This project's engine is missing or incomplete: ${engineRoot}`);
  console.error("Try reinstalling the kit in this project, or run 'aideck doctor' for details.");
  process.exit(1);
}

process.exit(spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: "inherit" }).status ?? 1);
