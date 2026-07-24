import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { copyTree, readJson } from "../lib/fs.ts";
import { ensureWorkspaceDirs, writePointer } from "../lib/workspace.ts";
import type { Workspace, WorkspacePointer } from "../lib/types.ts";

const DISTRIBUTION_ROOT_ENV = "AIDECK_" + "DISTRIBUTION_ROOT";
const SKIP_INSTALL_ENV = "AIDECK_" + "SKIP_INSTALL";

export function initCommand(args: string[]): void {
  const here = args.includes("--here");
  const dirIndex = args.indexOf("--dir");
  const subfolder = dirIndex === -1 ? "engine" : args[dirIndex + 1];
  if (dirIndex !== -1 && !subfolder) throw new Error("init --dir requires a subfolder path.");
  if (here && dirIndex !== -1) throw new Error("Choose either --here or --dir, not both.");

  const projectRoot = resolve(process.cwd());
  const targetEngine = resolve(projectRoot, subfolder ?? "engine");
  if (!isWithin(projectRoot, targetEngine) || targetEngine === projectRoot) throw new Error("init --dir must point to a subfolder of the current project.");
  const pointerPath = resolve(projectRoot, "ai-deck-kit.json");
  if (existsSync(pointerPath)) throw new Error(`Workspace already initialized: ${pointerPath}`);

  const distributionRoot = process.env[DISTRIBUTION_ROOT_ENV] ? resolve(process.env[DISTRIBUTION_ROOT_ENV]!) : fileURLToPath(new URL("../..", import.meta.url));
  const sourceEngine = existsSync(resolve(distributionRoot, "engine.version.json")) ? distributionRoot : resolve(distributionRoot, "engine");
  copyTree(sourceEngine, targetEngine);
  const engineVersion = readJson<{ engineVersion: string }>(resolve(targetEngine, "engine.version.json")).engineVersion;
  const pointer: WorkspacePointer = {
    engineRoot: `./${relative(projectRoot, targetEngine) || "engine"}`,
    decksRoot: "./decks",
    engineVersion,
  };
  const workspace = { root: projectRoot, pointerPath, pointer, engineRoot: targetEngine, decksRoot: resolve(projectRoot, "decks") } as Workspace;
  writePointer(projectRoot, pointer);
  ensureWorkspaceDirs(workspace);
  installDependencies(targetEngine);
  console.log(`Initialized AI Deck Kit workspace: ${projectRoot}`);
  console.log(`  engine: ${relative(projectRoot, targetEngine)}`);
  console.log(`  decks:  ${relative(projectRoot, workspace.decksRoot)}`);
}

function installDependencies(engineRoot: string): void {
  if (process.env[SKIP_INSTALL_ENV] === "1") return;
  const result = spawnSync("npm", ["install", "--prefix", engineRoot, "--no-audit", "--no-fund"], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Engine dependency installation failed. Re-run with the offline install flag only for a CLI-only workspace.");
}

function isWithin(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}
