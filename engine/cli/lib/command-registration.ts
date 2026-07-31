// Making `aideck` typeable.
//
// The kit itself stays project-scoped. What gets registered globally is only a
// resolver: it walks up from the working directory to the nearest ai-deck-kit.json
// and hands control to THAT workspace's engine. So one registration serves every
// project, and each project keeps running its own pinned engine version.
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { engineRoot } from "./engine-root.ts";

const SHIM_MARKER = "ai-deck-kit-resolver-shim";

export type RegistrationResult = { binary: string; binDir: string; onPath: boolean };

/**
 * The global launcher, taken verbatim from the resolver this engine ships. It is
 * copied rather than symlinked so that removing or upgrading one project's engine
 * cannot break the command for every other project.
 */
function shimSource(): string {
  return readFileSync(join(engineRoot(), "cli", "resolver.mjs"), "utf8");
}

/** npm's global bin directory — where a registered command has to live. */
export function globalBinDir(): string {
  const configured = process.env["npm_config_" + "prefix"];
  if (configured) return binDirFor(configured);
  const result = spawnSync("npm", ["prefix", "-g"], { encoding: "utf8" });
  const prefix = result.status === 0 ? result.stdout.trim() : "";
  // npm masks path segments it mistakes for secrets, so a reported prefix that
  // does not exist is unusable. Node's own folder is where global commands land
  // on every common setup (system, Homebrew, nvm, Volta).
  if (prefix && existsSync(prefix)) return binDirFor(prefix);
  return dirname(process.execPath);
}

function binDirFor(prefix: string): string {
  return process.platform === "win32" ? prefix : join(prefix, "bin");
}

export function registerCommand(): RegistrationResult {
  const binDir = globalBinDir();
  mkdirSync(binDir, { recursive: true });
  const binary = join(binDir, process.platform === "win32" ? "aideck.mjs" : "aideck");
  if (existsSync(binary) && !isShim(binary) && !isLegacyRegistration(binary)) {
    throw new Error(`Something else already provides "aideck" at ${binary}. Remove it first, or use the ./aideck wrapper in your project instead.`);
  }
  // An older registration points straight at one project's engine, which would run
  // that engine against every other project. Replacing it with the resolver is the fix.
  if (existsSync(binary) || isDanglingLink(binary)) rmSync(binary, { force: true });
  writeFileSync(binary, shimSource());
  if (process.platform !== "win32") chmodSync(binary, 0o755);
  return { binary, binDir, onPath: isOnPath(binDir) };
}

export function unregisterCommand(): string | undefined {
  const binary = join(globalBinDir(), process.platform === "win32" ? "aideck.mjs" : "aideck");
  if (!existsSync(binary) && !isDanglingLink(binary)) return undefined;
  if (!isShim(binary) && !isLegacyRegistration(binary)) throw new Error(`Refusing to remove ${binary}: it was not created by this toolkit.`);
  rmSync(binary, { force: true });
  return binary;
}

export function isRegistered(): boolean {
  try {
    const binary = join(globalBinDir(), process.platform === "win32" ? "aideck.mjs" : "aideck");
    return existsSync(binary) && isShim(binary);
  } catch {
    return false;
  }
}

/**
 * A `./aideck` launcher in the project root, so the toolkit is usable with no
 * global registration at all — the fallback for locked-down machines.
 */
export function writeProjectWrapper(projectRoot: string, engineRoot: string): string {
  const enginePath = relative(projectRoot, engineRoot) || "engine";
  const wrapper = join(projectRoot, "aideck");
  writeFileSync(wrapper, `#!/bin/sh\n# Runs this project's AI Deck Kit engine without needing a global command.\nexec node "$(dirname "$0")/${enginePath}/cli/index.mjs" "$@"\n`);
  if (process.platform !== "win32") chmodSync(wrapper, 0o755);
  return wrapper;
}

export function pathAdviceFor(binDir: string): string[] {
  const shellRc = process.env.SHELL?.includes("zsh") ? "~/.zshrc" : "~/.bashrc";
  return [
    `The command was installed to ${binDir}, but that folder is not on your PATH,`,
    "so typing 'aideck' will not find it yet. To fix it, run:",
    "",
    process.platform === "win32"
      ? `  setx PATH "%PATH%;${binDir}"`
      : `  echo 'export PATH="${binDir}:$PATH"' >> ${shellRc}`,
    "",
    "Then close and reopen your terminal.",
    "You can always use ./aideck from your project folder instead.",
  ];
}

function isShim(path: string): boolean {
  try {
    return readFileSync(path, "utf8").includes(SHIM_MARKER);
  } catch {
    return false;
  }
}

/**
 * An earlier `npm link` style registration: a symlink straight into some project's
 * engine CLI. Ours to replace — leaving it in place is what causes one project's
 * engine to run against another project's decks.
 */
function isLegacyRegistration(path: string): boolean {
  try {
    if (!lstatSync(path).isSymbolicLink()) return false;
    const target = resolve(dirname(path), readlinkSync(path));
    return target.endsWith(join("engine", "cli", "index.mjs")) || target.includes(join("node_modules", "ai-deck-kit"));
  } catch {
    return false;
  }
}

function isDanglingLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function isOnPath(directory: string): boolean {
  return (process.env.PATH ?? "").split(delimiter).some((entry) => entry === directory);
}
