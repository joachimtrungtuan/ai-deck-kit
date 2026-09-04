import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { replaceTree, readJson, writeJson } from "../lib/fs.js";
import { installEngineDependencies } from "../lib/engine-dependencies.js";
import { describeEngineDrift, engineDrift, hasEngineDrift, writeEngineIntegrityManifest } from "../lib/engine-integrity.js";
import { offerProjectAgentRules } from "../lib/project-agent-rules.js";
import { listTemplates, migrateLegacyRegisteredTemplates, validateTemplateBundle } from "../lib/templates.js";
import { rewireProjectAgentHomes } from "./wire-skills.js";
const ENGINE_SOURCE_ENV = "AIDECK_" + "ENGINE_SOURCE";
const DISTRIBUTION_ROOT_ENV = "AIDECK_" + "DISTRIBUTION_ROOT";
const PACKAGE_SPEC_ENV = "AIDECK_" + "PACKAGE_SPEC";
const GITHUB_REPOSITORY_ENV = "AIDECK_" + "GITHUB_REPOSITORY";
export function upgradeCommand(workspace, args, afterUpgrade) {
    const requestedVersion = option(args, "--to");
    const sourceOption = option(args, "--source");
    const sourceEngine = resolveSourceEngine(workspace, requestedVersion, sourceOption);
    const sourceVersion = readJson(join(sourceEngine, "engine.version.json")).engineVersion;
    if (!sourceVersion)
        throw new Error(`Engine source has no engine.version.json: ${sourceEngine}`);
    if (requestedVersion && requestedVersion !== sourceVersion)
        throw new Error(`Requested ${requestedVersion}, but source provides ${sourceVersion}.`);
    assertUpgradeScope(workspace);
    if (resolve(sourceEngine) === resolve(workspace.engineRoot)) {
        console.log(`Engine already uses bundled version ${sourceVersion}; decks were untouched.`);
        return;
    }
    // Templates the user authored under the old layout still sit in the engine root. Move them to the
    // project before the engine tree is replaced, or the upgrade would take them with it.
    const rescued = migrateLegacyRegisteredTemplates(workspace, sourceEngine);
    if (rescued.length)
        console.log(`Moved your templates out of the engine into ./templates: ${rescued.join(", ")}`);
    warnAboutEngineEdits(workspace.engineRoot);
    replaceTree(sourceEngine, workspace.engineRoot);
    writeJson(workspace.pointerPath, { ...workspace.pointer, engineVersion: sourceVersion });
    // The new engine ships its own package.json; its components must be installed or preview breaks.
    installEngineDependencies(workspace.engineRoot);
    writeEngineIntegrityManifest(workspace.engineRoot);
    console.log(`Upgraded engine to ${sourceVersion}. Your decks and templates were left as they are.`);
    reportTemplateCompatibility(workspace);
    // Asked here too, so projects installed before the boundary rules existed pick them up, and a
    // revised block reaches everyone. Without a TTY only an existing block is refreshed.
    offerProjectAgentRules(workspace.root, relative(workspace.root, workspace.engineRoot), false);
    // Skill links and the safeguard scripts both point into the engine tree just replaced, so one
    // upgrade refreshes everything an installed project runs rather than leaving it half-old.
    rewireProjectAgentHomes(workspace.root, workspace.engineRoot);
    afterUpgrade();
}
/**
 * Replacing the engine leaves every template exactly where it was, so a bundle authored against an
 * older engine keeps working only as far as the new one still accepts it. Name the ones that no
 * longer load here, rather than letting the first failure surface from an unrelated command later.
 */
function reportTemplateCompatibility(workspace) {
    const broken = listTemplates(workspace)
        .filter((entry) => entry.origin === "project")
        .map((entry) => ({ name: entry.name, errors: validateTemplateBundle(entry.root, entry.manifest) }))
        .filter((entry) => entry.errors.length > 0);
    if (!broken.length)
        return;
    console.log("");
    console.log("These templates no longer load and need attention before you can build with them:");
    for (const { name, errors } of broken) {
        console.log(`  ${name}`);
        errors.forEach((error) => console.log(`    - ${error}`));
    }
    console.log("");
}
/**
 * Announce edits the replacement is about to destroy, then continue. Blocking would strand a user
 * whose only route forward is the upgrade; saying nothing is how the loss became invisible.
 */
function warnAboutEngineEdits(engineRoot) {
    const drift = engineDrift(engineRoot);
    if (!hasEngineDrift(drift))
        return;
    console.log("");
    console.log("Heads up: the installed engine has been edited, and upgrading replaces the whole");
    console.log("engine folder. These changes are about to be lost:");
    describeEngineDrift(drift).forEach((line) => console.log(`  ${line}`));
    console.log("");
    console.log("Copy anything you still need out of the engine now. Template work belongs in");
    console.log("templates/, deck work in decks/. Continuing with the upgrade.");
    console.log("");
}
function resolveSourceEngine(workspace, requestedVersion, sourceOption) {
    const explicit = sourceOption ?? process.env[ENGINE_SOURCE_ENV];
    if (explicit)
        return normalizeEngineRoot(resolve(process.cwd(), explicit));
    const distributionRoot = process.env[DISTRIBUTION_ROOT_ENV] ? normalizeEngineRoot(resolve(process.env[DISTRIBUTION_ROOT_ENV])) : undefined;
    const bundledVersion = distributionRoot ? readJson(join(distributionRoot, "engine.version.json")).engineVersion : undefined;
    if (distributionRoot && requestedVersion && requestedVersion === bundledVersion)
        return distributionRoot;
    if (distributionRoot && !requestedVersion && resolve(distributionRoot) !== resolve(workspace.engineRoot))
        return distributionRoot;
    const currentVersion = readJson(join(workspace.engineRoot, "engine.version.json")).engineVersion;
    if (requestedVersion && requestedVersion === currentVersion)
        return workspace.engineRoot;
    const sourcePath = distributionRoot ?? workspace.engineRoot;
    const source = readJson(join(sourcePath, "distribution.json")).source;
    return fetchEngine(requestedVersion, source);
}
function fetchEngine(version, configuredSource) {
    const destination = mkdtempSync(join(tmpdir(), "ai-deck-kit-upgrade-"));
    const repository = process.env[GITHUB_REPOSITORY_ENV];
    const packageSource = configuredSource ?? (repository ? `github:${repository}` : `ai-deck-kit`);
    const spec = process.env[PACKAGE_SPEC_ENV] ?? `${packageSource}${version && packageSource.startsWith("github:") ? `#v${version}` : version ? `@${version}` : ""}`;
    const packed = spawnSync("npm", ["pack", spec, "--pack-destination", destination], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
        env: { ...process.env, npm_config_allow_git: "all" },
    });
    if (packed.status !== 0)
        throw new Error(unfetchableEngineMessage(spec));
    const archive = readdirSync(destination).find((entry) => entry.endsWith(".tgz"));
    if (!archive)
        throw new Error(`Package source did not produce an archive: ${spec}.`);
    const unpacked = spawnSync("tar", ["-xzf", join(destination, archive), "-C", destination], { stdio: "inherit" });
    if (unpacked.status !== 0)
        throw new Error(`Could not unpack engine source from ${spec}.`);
    const fetchedSource = normalizeEngineRoot(join(destination, "package"));
    if (!existsSync(join(fetchedSource, "engine.version.json")))
        throw new Error(`Fetched package has no engine directory: ${spec}.`);
    return fetchedSource;
}
// npm prepares a git-sourced package by spawning a nested, project-scoped `npm install` that
// inherits the user's ~/.npmrc. Settings npm rejects in that context (allow-scripts, and others
// as npm tightens them) fail the nested install, which surfaces here only as a non-zero exit.
// Point the user at the generic escape hatch rather than any one setting name.
function unfetchableEngineMessage(spec) {
    return [
        `Could not fetch engine source from ${spec}.`,
        "If you have custom npm settings in ~/.npmrc, they can break npm's internal git-dependency install. Retry with:",
        "  npm_config_userconfig=/dev/null aideck upgrade",
    ].join("\n");
}
function normalizeEngineRoot(path) {
    const candidate = resolve(path);
    return existsSync(join(candidate, "engine.version.json")) ? candidate : join(candidate, "engine");
}
function assertUpgradeScope(workspace) {
    const engine = resolve(workspace.engineRoot);
    const decks = resolve(workspace.decksRoot);
    if (engine === decks || engine.startsWith(`${decks}/`) || decks.startsWith(`${engine}/`))
        throw new Error("Refusing upgrade: engineRoot and decksRoot overlap.");
    if (relative(workspace.root, engine).startsWith("..") || relative(workspace.root, decks).startsWith(".."))
        throw new Error("Refusing upgrade: workspace paths must stay inside the project root.");
}
function option(args, name) {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
}
