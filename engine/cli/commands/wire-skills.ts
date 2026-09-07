// Interactive placement of the engine's skills into an agent folder.
//
// Split from init because it is also worth running on its own: after adding a
// second agent, after moving the project, or when the install was told to skip.
import { join, relative } from "node:path";
import { valueAfter } from "../lib/cli-args.ts";
import { findAgentHomes, resolveAgentHome, unwireSkills, wireSkills, type AgentHome } from "../lib/agent-skills.ts";
import { claudeEngineGuardRegistered, installClaudeEngineGuard, uninstallClaudeEngineGuard } from "../lib/claude-engine-guard.ts";
import { claudeVerifyHookRegistered, installClaudeVerifyHook, uninstallClaudeVerifyHook } from "../lib/claude-verify-hook.ts";
import { isInteractive, promptChoice, promptLine } from "../lib/prompt.ts";
import { removeProjectAgentRules } from "../lib/project-agent-rules.ts";
import { removeProjectGitignore } from "../lib/project-gitignore.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const skillsHelp = `Skill commands:
  skills wire [--to <path>] [--safeguards]   Link engine skills into an agent folder (.claude, .agents)
                                              --safeguards installs the Claude write-guard and verify
                                              hooks non-interactively instead of asking or skipping
  skills unwire [--to <path>]                Undo 'wire': remove the skill links this toolkit created,
                                              its Claude safeguard hooks, and the boundary notes in
                                              AGENTS.md / CLAUDE.md / .gitignore`;

export function runSkills(args: string[]): void {
  if (args.includes("--help") || !["wire", "unwire"].includes(args[0])) return console.log(skillsHelp);
  const workspace = findWorkspace();
  const explicit = valueAfter(args, "--to");
  if (args[0] === "wire") return wireSkillsInteractively(workspace.root, workspace.engineRoot, explicit, args.includes("--safeguards"));
  unwireSkillsFromProject(workspace.root, workspace.engineRoot, explicit);
}
/**
 * Choose an agent folder and link the skills into it.
 * `explicitPath` skips the questions. Without a TTY nothing is written unless a
 * home sits at the project root, so automated installs stay predictable.
 * `safeguardsRequested` installs the Claude safeguards without asking, for a non-interactive
 * install that still wants them — see `offerClaudeSafeguards`.
 */
export function wireSkillsInteractively(projectRoot: string, engineRoot: string, explicitPath?: string, safeguardsRequested = false): void {
  if (explicitPath) return report(projectRoot, engineRoot, resolveAgentHome(explicitPath, projectRoot), safeguardsRequested);

  const homes = findAgentHomes(projectRoot);
  const atProjectRoot = homes.filter((home) => home.distance === 0);

  if (!isInteractive()) {
    if (!atProjectRoot.length) {
      console.log("");
      console.log("Skipped connecting the AI skills: no .claude or .agents folder at this project root.");
      console.log("Run 'aideck skills wire' later to connect them.");
      return;
    }
    atProjectRoot.forEach((home) => report(projectRoot, engineRoot, home, safeguardsRequested));
    return;
  }

  if (atProjectRoot.length) {
    atProjectRoot.forEach((home) => report(projectRoot, engineRoot, home, safeguardsRequested));
    return;
  }

  console.log("");
  console.log("Connecting the AI skills so your agent can find them.");
  console.log("No .claude or .agents folder was found in this project.");

  const choice = promptChoice(
    homes.length
      ? `\nThe nearest one found further up is:\n\n  ${homes[0].path}\n\nWhat would you like to do?`
      : "\nNone was found anywhere above this folder either.\n\nWhat would you like to do?",
    [
      ...(homes.length ? [`Use that folder (${shorten(homes[0].path)})`] : []),
      "Enter the path to the agent folder myself",
      "Skip for now (you can run 'aideck skills wire' later)",
    ],
  );

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
    return report(projectRoot, engineRoot, resolveAgentHome(entered, projectRoot), safeguardsRequested);
  }
  report(projectRoot, engineRoot, homes[0], safeguardsRequested);
}

/**
 * Re-run the wiring for agent homes that sit at the project root. Called by `upgrade`: the engine
 * tree it replaced is what the skill links and the safeguard scripts point at, so a project that was
 * set up once keeps working without the user remembering to run `aideck skills wire` again.
 * Homes further up are left alone — they may serve other projects, and were an explicit choice.
 */
export function rewireProjectAgentHomes(projectRoot: string, engineRoot: string): void {
  findAgentHomes(projectRoot)
    .filter((home) => home.distance === 0)
    .forEach((home) => report(projectRoot, engineRoot, home, false));
}

/**
 * Undo everything `wire` did for this project: skill links and Claude safeguard hooks in each agent
 * home (an explicit `--to` path, otherwise every home found at the project root — the same set a
 * non-interactive `wire` would have used), plus the project-level boundary notes in
 * AGENTS.md/CLAUDE.md and .gitignore. Safe to run even after `aideck uninstall` has already deleted
 * the engine: a managed link is identified by where it points, not by that target still existing.
 */
export function unwireSkillsFromProject(projectRoot: string, engineRoot: string, explicitPath?: string): void {
  const homes = explicitPath ? [resolveAgentHome(explicitPath, projectRoot)] : findAgentHomes(projectRoot).filter((home) => home.distance === 0);
  if (!homes.length) {
    console.log("");
    console.log("No .claude or .agents folder found at this project root — nothing to unwire.");
  }
  homes.forEach((home) => unwireHome(projectRoot, engineRoot, home));

  const rulesChanged = removeProjectAgentRules(projectRoot);
  const gitignoreChanged = removeProjectGitignore(projectRoot);
  if (rulesChanged.length || gitignoreChanged) {
    console.log("");
    rulesChanged.forEach((name) => console.log(`Removed the AI Deck Kit boundary section from ${name}.`));
    if (gitignoreChanged) console.log("Removed the AI Deck Kit block from .gitignore.");
  }
}

function unwireHome(projectRoot: string, engineRoot: string, home: AgentHome): void {
  const removed = unwireSkills(engineRoot, home);
  console.log("");
  console.log(`Disconnected AI skills from ${home.path}`);
  removed.forEach((name) => console.log(`  removed  ${name}`));
  if (!removed.length) console.log("  (nothing linked by this toolkit was found)");
  if (home.name !== ".claude") return;
  const guardRemoved = uninstallClaudeEngineGuard(home.path);
  const verifyRemoved = uninstallClaudeVerifyHook(home.path);
  if (guardRemoved || verifyRemoved) console.log(`Removed the write-guard and verify safeguards from ${join(home.path, "settings.json")}`);
}

function report(projectRoot: string, engineRoot: string, home: AgentHome, safeguardsRequested: boolean): void {
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
  offerClaudeSafeguards(projectRoot, home, safeguardsRequested);
}

/**
 * Two Claude-specific safeguards: one refuses a write to a file the kit owns, the other checks the
 * workspace once the agent stops editing. They are one question because they are one job — keeping
 * the agent's work where an upgrade will not erase it.
 *
 * They edit a settings file the user owns, so they are asked for and never installed silently. Once
 * a home already runs them, a later upgrade refreshes the scripts without asking again: consent was
 * given, and a stale script is worse than no script. `safeguardsRequested` (`--safeguards`) opts in
 * without asking, for a non-interactive install that still wants them installed.
 */
function offerClaudeSafeguards(projectRoot: string, home: AgentHome, safeguardsRequested: boolean): void {
  if (home.name !== ".claude") return;
  const installed = claudeEngineGuardRegistered(home.path) && claudeVerifyHookRegistered(home.path);
  if (!installed && !safeguardsRequested) {
    if (!isInteractive()) {
      console.log("");
      console.log(`Skipped the toolkit's write-guard and verify safeguards for ${home.path} (no interactive prompt available).`);
      console.log(`Run 'aideck skills wire --safeguards' to add them non-interactively.`);
      return;
    }
    console.log("");
    const choice = promptChoice(
      "Protect the toolkit from accidental edits?\n\nThis adds two rules to .claude/settings.json: one stops the agent writing inside\nthe engine folder, which upgrades replace wholesale; the other checks your designs\nand presentations after the agent finishes editing. Your files are never changed\nby either of them.",
      ["Yes — add the safeguards (recommended)", "No thanks"],
    );
    if (choice !== 0) return;
  }
  // Only the project's own root-level home can rely on $CLAUDE_PROJECT_DIR: Claude Code sets it to
  // wherever it was launched from, which matches this home exactly. A home found further up may be
  // shared by other projects launched elsewhere, so it keeps the absolute path baked in.
  const useProjectDirVar = home.path === join(projectRoot, ".claude");
  const settingsPath = installClaudeEngineGuard(home.path, useProjectDirVar).settingsPath;
  installClaudeVerifyHook(home.path, useProjectDirVar);
  console.log(installed ? `Refreshed the safeguards in ${settingsPath}` : `Added the safeguards to ${settingsPath}`);
}

function shorten(path: string): string {
  const home = process.env.HOME;
  return home && path.startsWith(home) ? path.replace(home, "~") : path;
}
