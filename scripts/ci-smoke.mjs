#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = join(root, "bin", "create-ai-deck-kit");
const workspace = mkdtempSync(join(tmpdir(), "ai-deck-kit-ci-"));
const ciSkipInstallEnv = "AIDECK_" + "CI_SKIP_INSTALL";
const skipInstallEnv = "AIDECK_" + "SKIP_INSTALL";
const env = process.env[ciSkipInstallEnv] === "1" ? { [skipInstallEnv]: "1" } : process.env;

run([cli, "init", "--dir", "tools/ai-deck-kit"], workspace, env);
for (const [slug, template] of [
  ["swiss-smoke", "swiss-modern"],
  ["linear-smoke", "linear-dark"],
]) {
  const targetCli = join(workspace, "tools", "ai-deck-kit", "cli", "index.mjs");
  run([targetCli, "new", slug, "--template", template], workspace, env);
  run([targetCli, "validate", slug], workspace, env);
  if (process.env[ciSkipInstallEnv] !== "1") {
    if (slug === "swiss-smoke") {
      const directHtmlExport = join(workspace, "tools", "ai-deck-kit", "skills", "presentation-crafting", "scripts", "export-standalone-html.mjs");
      run([directHtmlExport, "--deck", slug], workspace, env);
    }
    run([targetCli, "export", "html", slug], workspace, env);
    run([targetCli, "export", "pdf", slug], workspace, env);
  }
}

const decksBefore = hashTree(join(workspace, "decks"));
const nextEngine = join(workspace, "next-engine");
const generatedDirectories = new Set(["node_modules", "storybook-static", "dist", ".build"]);
cpSync(join(root, "engine"), nextEngine, { recursive: true, filter: (source) => !generatedDirectories.has(basename(source)) });
const versionFile = join(nextEngine, "engine.version.json");
writeFileSync(versionFile, readFileSync(versionFile, "utf8").replace('"0.1.0"', '"0.1.1"'));
run([join(workspace, "tools", "ai-deck-kit", "cli", "index.mjs"), "upgrade", "--to", "0.1.1", "--source", nextEngine], workspace, env);
if (hashTree(join(workspace, "decks")) !== decksBefore) throw new Error("Upgrade changed the decks tree.");
console.log(`CI smoke passed in ${workspace}`);

function run(args, cwd, environment) {
  const result = spawnSync(process.execPath, args, { cwd, env: environment, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Command failed: ${args.join(" ")}`);
}

function hashTree(directory) {
  const hash = createHash("sha256");
  for (const file of files(directory)) {
    hash.update(relative(directory, file));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}
