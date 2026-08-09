import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { replaceTree, readJson, writeJson } from "../lib/fs.ts";
import { installEngineDependencies } from "../lib/engine-dependencies.ts";
import { migrateLegacyRegisteredTemplates } from "../lib/templates.ts";
import type { Workspace } from "../lib/types.ts";

const ENGINE_SOURCE_ENV = "AIDECK_" + "ENGINE_SOURCE";
const DISTRIBUTION_ROOT_ENV = "AIDECK_" + "DISTRIBUTION_ROOT";
const PACKAGE_SPEC_ENV = "AIDECK_" + "PACKAGE_SPEC";
const GITHUB_REPOSITORY_ENV = "AIDECK_" + "GITHUB_REPOSITORY";

export function upgradeCommand(workspace: Workspace, args: string[], afterUpgrade: () => void): void {
  const requestedVersion = option(args, "--to");
  const sourceOption = option(args, "--source");
  const sourceEngine = resolveSourceEngine(workspace, requestedVersion, sourceOption);
  const sourceVersion = readJson<{ engineVersion?: string }>(join(sourceEngine, "engine.version.json")).engineVersion;
  if (!sourceVersion) throw new Error(`Engine source has no engine.version.json: ${sourceEngine}`);
  if (requestedVersion && requestedVersion !== sourceVersion) throw new Error(`Requested ${requestedVersion}, but source provides ${sourceVersion}.`);
  assertUpgradeScope(workspace);
  if (resolve(sourceEngine) === resolve(workspace.engineRoot)) {
    console.log(`Engine already uses bundled version ${sourceVersion}; decks were untouched.`);
    return;
  }
  // Templates the user authored under the old layout still sit in the engine root. Move them to the
  // project before the engine tree is replaced, or the upgrade would take them with it.
  const rescued = migrateLegacyRegisteredTemplates(workspace, sourceEngine);
  if (rescued.length) console.log(`Moved your templates out of the engine into ./templates: ${rescued.join(", ")}`);
  replaceTree(sourceEngine, workspace.engineRoot);
  writeJson(workspace.pointerPath, { ...workspace.pointer, engineVersion: sourceVersion });
  // The new engine ships its own package.json; its components must be installed or preview breaks.
  installEngineDependencies(workspace.engineRoot);
  console.log(`Upgraded engine to ${sourceVersion}; your decks and templates were untouched.`);
  afterUpgrade();
}

function resolveSourceEngine(workspace: Workspace, requestedVersion?: string, sourceOption?: string): string {
  const explicit = sourceOption ?? process.env[ENGINE_SOURCE_ENV];
  if (explicit) return normalizeEngineRoot(resolve(process.cwd(), explicit));
  const distributionRoot = process.env[DISTRIBUTION_ROOT_ENV] ? normalizeEngineRoot(resolve(process.env[DISTRIBUTION_ROOT_ENV]!)) : undefined;
  const bundledVersion = distributionRoot ? readJson<{ engineVersion?: string }>(join(distributionRoot, "engine.version.json")).engineVersion : undefined;
  if (distributionRoot && requestedVersion && requestedVersion === bundledVersion) return distributionRoot;
  if (distributionRoot && !requestedVersion && resolve(distributionRoot) !== resolve(workspace.engineRoot)) return distributionRoot;
  const currentVersion = readJson<{ engineVersion?: string }>(join(workspace.engineRoot, "engine.version.json")).engineVersion;
  if (requestedVersion && requestedVersion === currentVersion) return workspace.engineRoot;
  const sourcePath = distributionRoot ?? workspace.engineRoot;
  const source = readJson<{ source?: string }>(join(sourcePath, "distribution.json")).source;
  return fetchEngine(requestedVersion, source);
}

function fetchEngine(version?: string, configuredSource?: string): string {
  const destination = mkdtempSync(join(tmpdir(), "ai-deck-kit-upgrade-"));
  const repository = process.env[GITHUB_REPOSITORY_ENV];
  const packageSource = configuredSource ?? (repository ? `github:${repository}` : `ai-deck-kit`);
  const spec = process.env[PACKAGE_SPEC_ENV] ?? `${packageSource}${version && packageSource.startsWith("github:") ? `#v${version}` : version ? `@${version}` : ""}`;
  const packed = spawnSync("npm", ["pack", spec, "--pack-destination", destination], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, npm_config_allow_git: "all" },
  });
  if (packed.status !== 0) throw new Error(`Could not fetch engine source from ${spec}.`);
  const archive = readdirSync(destination).find((entry) => entry.endsWith(".tgz"));
  if (!archive) throw new Error(`Package source did not produce an archive: ${spec}.`);
  const unpacked = spawnSync("tar", ["-xzf", join(destination, archive), "-C", destination], { stdio: "inherit" });
  if (unpacked.status !== 0) throw new Error(`Could not unpack engine source from ${spec}.`);
  const fetchedSource = normalizeEngineRoot(join(destination, "package"));
  if (!existsSync(join(fetchedSource, "engine.version.json"))) throw new Error(`Fetched package has no engine directory: ${spec}.`);
  return fetchedSource;
}

function normalizeEngineRoot(path: string): string {
  const candidate = resolve(path);
  return existsSync(join(candidate, "engine.version.json")) ? candidate : join(candidate, "engine");
}

function assertUpgradeScope(workspace: Workspace): void {
  const engine = resolve(workspace.engineRoot);
  const decks = resolve(workspace.decksRoot);
  if (engine === decks || engine.startsWith(`${decks}/`) || decks.startsWith(`${engine}/`)) throw new Error("Refusing upgrade: engineRoot and decksRoot overlap.");
  if (relative(workspace.root, engine).startsWith("..") || relative(workspace.root, decks).startsWith("..")) throw new Error("Refusing upgrade: workspace paths must stay inside the project root.");
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
