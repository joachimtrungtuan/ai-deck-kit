import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readJson, writeJson } from "../lib/fs.js";
import { checkPrerequisites, formatPrerequisiteReport, hasFailures } from "../lib/prerequisites.js";
import { deckBundles, deckDrift, describeDrift } from "../lib/deck-template-sync.js";
import { migrateLegacyRegisteredTemplates } from "../lib/templates.js";
import { inspectSchemaGuidance } from "../lib/schema-guidance.js";
import { findWorkspace } from "../lib/workspace.js";
import { initCommand } from "./init.js";
import { upgradeCommand } from "./upgrade.js";
import { printVerifyReport, verifyCommand, verifyWorkspace } from "./verify.js";
export const coreHelp = `Core commands:
  init [--here|--dir <path>]       Scaffold a workspace pointer and user roots
  upgrade [--to <version>]         Refresh the installed engine from this package
  verify                           Check the workspace boundary, templates, and deck content
  doctor                           verify, plus the software this machine needs
  config [--set key=value]         Read or update ai-deck-kit.json
  list                             List decks in the resolved workspace`;
export async function runCore(args) {
    const command = args[0] ?? "help";
    if (args.includes("--help") || command === "help") {
        console.log(coreHelp);
        return;
    }
    if (command === "init")
        return initCommand(args.slice(1));
    const workspace = findWorkspace();
    if (command === "upgrade")
        return upgradeCommand(workspace, args.slice(1), () => doctorCommand(findWorkspace()));
    if (command === "doctor")
        return doctorCommand(workspace);
    if (command === "verify")
        return verifyCommand(workspace);
    if (command === "config")
        return configCommand(workspace, args.slice(1));
    if (command === "list")
        return listCommand(workspace);
    throw new Error(`Unknown core command: ${command}`);
}
/**
 * Everything `verify` checks, plus the state of the machine it runs on. The split exists because the
 * agent verifier hook runs `verify` after every editing pass and must not pay for prerequisite probes.
 */
async function doctorCommand(workspace) {
    const prerequisites = checkPrerequisites({ git: "soft" });
    console.log(formatPrerequisiteReport(prerequisites));
    console.log("");
    const rescued = migrateLegacyRegisteredTemplates(workspace);
    if (rescued.length)
        console.log(`Moved your templates out of the engine into ./templates: ${rescued.join(", ")}\n`);
    const report = await verifyWorkspace(workspace);
    for (const entry of inspectSchemaGuidance(workspace)) {
        if (entry.state === "current")
            continue;
        report.errors.push(entry.level === "engine"
            ? `Engine schema guidance is missing. Run "aideck upgrade" or "aideck reinstall".`
            : `${entry.label}: schema-guidance.md is ${entry.state}. Run "aideck guidance sync".`);
    }
    if (hasFailures(prerequisites))
        report.errors.unshift("Required software is missing — see the list above.");
    printVerifyReport(report);
    if (report.errors.length)
        process.exitCode = 1;
}
function configCommand(workspace, args) {
    const set = option(args, "--set");
    if (!set) {
        console.log(JSON.stringify(workspace.pointer, null, 2));
        return;
    }
    const separator = set.indexOf("=");
    if (separator < 1)
        throw new Error("config --set expects key=value.");
    const key = set.slice(0, separator);
    if (!(key in workspace.pointer))
        throw new Error(`Unknown config key: ${key}`);
    const value = set.slice(separator + 1);
    if ((key === "engineRoot" || key === "decksRoot") && !isWithinProjectRoot(workspace.root, value)) {
        throw new Error(`config --set ${key} must resolve inside the project root: ${workspace.root}`);
    }
    const pointer = { ...workspace.pointer, [key]: value };
    writeJson(workspace.pointerPath, pointer);
    console.log(`Updated ${key}.`);
}
function isWithinProjectRoot(root, candidate) {
    const relativePath = relative(root, resolve(root, candidate));
    return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}
function listCommand(workspace) {
    if (!existsSync(workspace.decksRoot)) {
        console.log("No decks found.");
        return;
    }
    const decks = deckBundles(workspace);
    if (!decks.length)
        return console.log("No decks found.");
    decks.forEach((entry) => {
        const manifest = readJson(join(workspace.decksRoot, entry, "deck.json"));
        const drift = deckDrift(workspace, entry);
        console.log(`${manifest.slug}\t${manifest.status}\t${manifest.template?.set ?? "?"}@${manifest.template?.version ?? "?"}\t${describeDrift(drift)}\t${manifest.slides?.length ?? 0} slides\t${manifest.title}`);
    });
}
function option(args, name) {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
}
