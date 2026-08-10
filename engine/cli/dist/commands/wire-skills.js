// Interactive placement of the engine's skills into an agent folder.
//
// Split from init because it is also worth running on its own: after adding a
// second agent, after moving the project, or when the install was told to skip.
import { relative } from "node:path";
import { findAgentHomes, resolveAgentHome, wireSkills } from "../lib/agent-skills.js";
import { claudeEngineGuardRegistered, installClaudeEngineGuard } from "../lib/claude-engine-guard.js";
import { claudeVerifyHookRegistered, installClaudeVerifyHook } from "../lib/claude-verify-hook.js";
import { isInteractive, promptChoice, promptLine } from "../lib/prompt.js";
import { findWorkspace } from "../lib/workspace.js";
export const skillsHelp = `Skill commands:
  skills wire [--to <path>]        Link engine skills into an agent folder (.claude, .agents)`;
export function runSkills(args) {
    if (!args.length || args.includes("--help") || args[0] !== "wire")
        return console.log(skillsHelp);
    const workspace = findWorkspace();
    const explicit = valueAfter(args, "--to");
    wireSkillsInteractively(workspace.root, workspace.engineRoot, explicit);
}
/**
 * Choose an agent folder and link the skills into it.
 * `explicitPath` skips the questions. Without a TTY nothing is written unless a
 * home sits at the project root, so automated installs stay predictable.
 */
export function wireSkillsInteractively(projectRoot, engineRoot, explicitPath) {
    if (explicitPath)
        return report(engineRoot, resolveAgentHome(explicitPath, projectRoot));
    const homes = findAgentHomes(projectRoot);
    const atProjectRoot = homes.filter((home) => home.distance === 0);
    if (!isInteractive()) {
        if (!atProjectRoot.length) {
            console.log("");
            console.log("Skipped connecting the AI skills: no .claude or .agents folder at this project root.");
            console.log("Run 'aideck skills wire' later to connect them.");
            return;
        }
        atProjectRoot.forEach((home) => report(engineRoot, home));
        return;
    }
    if (atProjectRoot.length) {
        atProjectRoot.forEach((home) => report(engineRoot, home));
        return;
    }
    console.log("");
    console.log("Connecting the AI skills so your agent can find them.");
    console.log("No .claude or .agents folder was found in this project.");
    const choice = promptChoice(homes.length
        ? `\nThe nearest one found further up is:\n\n  ${homes[0].path}\n\nWhat would you like to do?`
        : "\nNone was found anywhere above this folder either.\n\nWhat would you like to do?", [
        ...(homes.length ? [`Use that folder (${shorten(homes[0].path)})`] : []),
        "Enter the path to the agent folder myself",
        "Skip for now (you can run 'aideck skills wire' later)",
    ]);
    const skipIndex = homes.length ? 2 : 1;
    const manualIndex = homes.length ? 1 : 0;
    if (choice === skipIndex) {
        console.log("Skipped. Run 'aideck skills wire' whenever you are ready.");
        return;
    }
    if (choice === manualIndex) {
        const entered = promptLine("\nPath to the agent folder (.claude or .agents), or a project containing one: ");
        if (!entered) {
            console.log("Nothing entered — skipped. Run 'aideck skills wire' later.");
            return;
        }
        return report(engineRoot, resolveAgentHome(entered, projectRoot));
    }
    report(engineRoot, homes[0]);
}
/**
 * Re-run the wiring for agent homes that sit at the project root. Called by `upgrade`: the engine
 * tree it replaced is what the skill links and the safeguard scripts point at, so a project that was
 * set up once keeps working without the user remembering to run `aideck skills wire` again.
 * Homes further up are left alone — they may serve other projects, and were an explicit choice.
 */
export function rewireProjectAgentHomes(projectRoot, engineRoot) {
    findAgentHomes(projectRoot)
        .filter((home) => home.distance === 0)
        .forEach((home) => report(engineRoot, home));
}
function report(engineRoot, home) {
    const result = wireSkills(engineRoot, home);
    console.log("");
    console.log(`Connected AI skills to ${home.path}`);
    result.linked.forEach((name) => console.log(`  linked   ${name}`));
    result.skipped.forEach((name) => console.log(`  kept     ${name} (already exists and was not created by this toolkit)`));
    if (result.skipped.length) {
        console.log("");
        console.log(`Skipped entries above already exist in ${relative(process.cwd(), result.home) || result.home}.`);
        console.log("Remove or rename them, then run 'aideck skills wire' again to replace them.");
    }
    offerClaudeSafeguards(home);
}
/**
 * Two Claude-specific safeguards: one refuses a write to a file the kit owns, the other checks the
 * workspace once the agent stops editing. They are one question because they are one job — keeping
 * the agent's work where an upgrade will not erase it.
 *
 * They edit a settings file the user owns, so they are asked for and never installed silently. Once
 * a home already runs them, a later upgrade refreshes the scripts without asking again: consent was
 * given, and a stale script is worse than no script.
 */
function offerClaudeSafeguards(home) {
    if (home.name !== ".claude")
        return;
    const installed = claudeEngineGuardRegistered(home.path) && claudeVerifyHookRegistered(home.path);
    if (!installed) {
        if (!isInteractive())
            return;
        console.log("");
        const choice = promptChoice("Protect the toolkit from accidental edits?\n\nThis adds two rules to .claude/settings.json: one stops the agent writing inside\nthe engine folder, which upgrades replace wholesale; the other checks your designs\nand presentations after the agent finishes editing. Your files are never changed\nby either of them.", ["Yes — add the safeguards (recommended)", "No thanks"]);
        if (choice !== 0)
            return;
    }
    const settingsPath = installClaudeEngineGuard(home.path).settingsPath;
    installClaudeVerifyHook(home.path);
    console.log(installed ? `Refreshed the safeguards in ${settingsPath}` : `Added the safeguards to ${settingsPath}`);
}
function shorten(path) {
    const home = process.env.HOME;
    return home && path.startsWith(home) ? path.replace(home, "~") : path;
}
function valueAfter(args, option) {
    const index = args.indexOf(option);
    return index === -1 ? undefined : args[index + 1];
}
