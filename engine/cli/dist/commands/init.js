import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { copyTree, readJson } from "../lib/fs.js";
import { installEngineDependencies } from "../lib/engine-dependencies.js";
import { writeEngineIntegrityManifest } from "../lib/engine-integrity.js";
import { engineRoot } from "../lib/engine-root.js";
import { ensureWorkspaceDirs, writePointer } from "../lib/workspace.js";
import { checkPrerequisites, formatPrerequisiteReport, hasFailures } from "../lib/prerequisites.js";
import { writeProjectWrapper } from "../lib/command-registration.js";
import { ensureProjectGitignore } from "../lib/project-gitignore.js";
import { offerProjectAgentRules } from "../lib/project-agent-rules.js";
import { isInteractive, promptChoice } from "../lib/prompt.js";
import { offerRegistration } from "./link.js";
import { wireSkillsInteractively } from "./wire-skills.js";
const DISTRIBUTION_ROOT_ENV = "AIDECK_" + "DISTRIBUTION_ROOT";
export function initCommand(args) {
    const here = args.includes("--here");
    const dirIndex = args.indexOf("--dir");
    const subfolder = dirIndex === -1 ? "engine" : args[dirIndex + 1];
    if (dirIndex !== -1 && !subfolder)
        throw new Error("init --dir requires a subfolder path.");
    if (here && dirIndex !== -1)
        throw new Error("Choose either --here or --dir, not both.");
    runPreflight(args.includes("--skip-checks"));
    const projectRoot = resolve(process.cwd());
    const targetEngine = resolve(projectRoot, subfolder ?? "engine");
    if (!isWithin(projectRoot, targetEngine) || targetEngine === projectRoot)
        throw new Error("init --dir must point to a subfolder of the current project.");
    const pointerPath = resolve(projectRoot, "ai-deck-kit.json");
    if (existsSync(pointerPath))
        throw new Error(`Workspace already initialized: ${pointerPath}`);
    const distributionRoot = process.env[DISTRIBUTION_ROOT_ENV] ? resolve(process.env[DISTRIBUTION_ROOT_ENV]) : engineRoot();
    const sourceEngine = existsSync(resolve(distributionRoot, "engine.version.json")) ? distributionRoot : resolve(distributionRoot, "engine");
    copyTree(sourceEngine, targetEngine);
    const engineVersion = readJson(resolve(targetEngine, "engine.version.json")).engineVersion;
    const pointer = {
        engineRoot: `./${relative(projectRoot, targetEngine) || "engine"}`,
        decksRoot: "./decks",
        engineVersion,
    };
    const workspace = { root: projectRoot, pointerPath, pointer, engineRoot: targetEngine, decksRoot: resolve(projectRoot, "decks") };
    writePointer(projectRoot, pointer);
    ensureWorkspaceDirs(workspace);
    installEngineDependencies(targetEngine);
    // Record what was installed so `doctor` can name any later edit to the engine before an upgrade
    // silently replaces it. Written only by the installer, so the kit's own repository has none.
    writeEngineIntegrityManifest(targetEngine);
    console.log("");
    console.log(`Set up AI Deck Kit in: ${projectRoot}`);
    const planted = [
        [relative(projectRoot, targetEngine), "the toolkit itself — upgradable, leave it alone"],
        [relative(projectRoot, workspace.decksRoot), "your presentations live here"],
        ["templates", "your own designs live here"],
    ];
    const column = Math.max(...planted.map(([path]) => path.length)) + 2;
    planted.forEach(([path, purpose]) => console.log(`  ${path.padEnd(column)}(${purpose})`));
    const gitignore = ensureProjectGitignore(projectRoot, relative(projectRoot, targetEngine));
    if (gitignore !== "unchanged") {
        console.log("");
        console.log(`${gitignore === "created" ? "Created" : "Updated"} .gitignore so the installed engine stays out of your repository.`);
        console.log("Your decks and ai-deck-kit.json are not ignored — commit them as usual.");
    }
    offerProjectAgentRules(projectRoot, relative(projectRoot, targetEngine), true);
    writeProjectWrapper(projectRoot, targetEngine);
    wireSkillsInteractively(projectRoot, targetEngine);
    registerIfWanted();
    printNextSteps();
}
function runPreflight(skipChecks) {
    const report = checkPrerequisites();
    console.log(formatPrerequisiteReport(report));
    if (!hasFailures(report))
        return;
    if (skipChecks) {
        console.log("Continuing anyway because --skip-checks was given. Expect failures.");
        return;
    }
    throw new Error("Missing required software — see the list above, then run this command again.");
}
function registerIfWanted() {
    if (!isInteractive())
        return;
    console.log("");
    const choice = promptChoice(`Would you like to be able to type "aideck" from anywhere?\n\nOnly a small launcher is installed system-wide. Your presentations, designs\nand the toolkit itself stay inside this project.`, [`Yes — register the "aideck" command (recommended)`, `No — I will use ./aideck inside this project`]);
    if (choice === 0)
        offerRegistration();
}
function printNextSteps() {
    console.log("");
    console.log("Done. Next steps:");
    console.log("");
    console.log("  1. Make your first presentation:   aideck new my-talk");
    console.log("  2. See it in your browser:         aideck serve --deck my-talk");
    console.log("  3. Save it as a file to share:     aideck export html my-talk");
    console.log("");
    console.log("Not sure something is set up right?  aideck doctor");
    console.log(`If "aideck" is not found, use ./aideck instead, from this folder.`);
}
function isWithin(root, candidate) {
    const relativePath = relative(root, candidate);
    return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}
