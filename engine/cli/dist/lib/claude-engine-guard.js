// A Claude Code hook that refuses writes to the files the kit owns: the installed engine, and the
// CLI-maintained parts of a deck bundle (`deck.json`, the frozen `template/` copy, `.build/`).
//
// Instructions alone are not enough: the engine is gitignored and replaced wholesale, and a deck's
// snapshot is rewritten by the next sync, so an edit that slips through is invisible until it
// disappears. This installs a PreToolUse hook into a `.claude` home so the attempt fails at the
// moment it is made, with the supported route in the error text. Claude-specific by nature; the
// integrity manifest (`engine-integrity.ts`) and `aideck verify` are the runtime-agnostic half.
import { installClaudeHook, isClaudeHookRegistered, uninstallClaudeHook } from "./claude-hooks.js";
const HOOK_FILE = "aideck-engine-guard.mjs";
const WRITE_TOOL_MATCHER = "Write|Edit|MultiEdit|NotebookEdit";
/** Write the guard script and register it as a `PreToolUse` hook in `<claudeHome>/settings.json`. */
export function installClaudeEngineGuard(claudeHome, useProjectDirVar) {
    return installClaudeHook({ claudeHome, event: "PreToolUse", file: HOOK_FILE, script: guardScript(), matcher: WRITE_TOOL_MATCHER, useProjectDirVar });
}
export function claudeEngineGuardRegistered(claudeHome) {
    return isClaudeHookRegistered(claudeHome, "PreToolUse", HOOK_FILE);
}
/** Remove the guard's `settings.json` registration and delete its script. */
export function uninstallClaudeEngineGuard(claudeHome) {
    return uninstallClaudeHook(claudeHome, "PreToolUse", HOOK_FILE);
}
/**
 * The guard resolves the workspace from the file being edited rather than from a path baked in at
 * install time, so one agent home can sit above several projects and a project can be moved.
 * It stays silent unless the engine carries an installer-written integrity manifest, which is what
 * keeps it inert inside the kit's own repository.
 */
function guardScript() {
    return `#!/usr/bin/env node
// Installed by AI Deck Kit ("aideck skills wire"). Blocks writes to files the kit owns: the
// installed engine, and the CLI-maintained parts of a deck bundle.
// Delete this file and its entry in settings.json to remove it.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const WRITE_TOOLS = new Set(${JSON.stringify(WRITE_TOOL_MATCHER.split("|"))});

const payload = await readStdin();
const filePath = payload?.tool_input?.file_path ?? payload?.tool_input?.notebook_path;
if (!WRITE_TOOLS.has(payload?.tool_name) || typeof filePath !== "string") process.exit(0);

const target = resolve(filePath);
const workspace = installedWorkspaceFor(target);
const refusal = workspace ? refuse(workspace, target) : undefined;
if (!refusal) process.exit(0);

console.error(refusal.join("\\n"));
process.exit(2);

/** The reason this write is not allowed, or nothing if it lands somewhere the agent owns. */
function refuse(workspace, file) {
  const shown = relative(workspace.root, file);
  if (isInside(workspace.engine, file)) {
    return [
      \`Refused: \${shown} is inside the installed AI Deck Kit engine.\`,
      "",
      "The engine is replaced wholesale by \\"aideck upgrade\\", so this edit would be lost.",
      "",
      "  - Template work belongs in templates/{name}.template/ — layouts, CSS, icon policy,",
      "    preview-props.json, and the manifest's fonts array.",
      "  - Deck work belongs in decks/{slug}.deck/content.md and assets/.",
      "  - If the change genuinely belongs in the engine, stop and report what is missing;",
      "    it is released through the AI Deck Kit project and arrives via \\"aideck upgrade\\".",
    ];
  }
  if (!isInside(workspace.decks, file)) return undefined;
  const [bundle, owned] = relative(workspace.decks, file).split(sep);
  if (!bundle?.endsWith(".deck")) return undefined;
  const slug = bundle.slice(0, -".deck".length);
  // Inside a deck the agent owns content.md and assets/. The rest is written by the CLI, and
  // rewritten by it — a hand edit is either discarded or leaves the bundle inconsistent.
  if (owned === "template") {
    return [
      \`Refused: \${shown} is the deck's frozen copy of its template, maintained by the CLI.\`,
      "",
      \`Edit the template itself, then re-sync the deck:\`,
      \`  1. change templates/{name}.template/ and bump templateVersion in its manifest\`,
      \`  2. run "aideck deck retemplate \${slug}"\`,
    ];
  }
  if (owned === "deck.json") {
    return [
      \`Refused: \${shown} is the deck manifest, maintained by the CLI.\`,
      "",
      "Slides are added, moved and typed through commands, which keep the manifest and",
      "content.md in step: \\"aideck slide ...\\", \\"aideck anim ...\\", \\"aideck transition ...\\".",
      \`Write the slide's words in decks/\${slug}.deck/content.md.\`,
    ];
  }
  if (owned === ".build") {
    return [\`Refused: \${shown} is generated output. It is rebuilt by "aideck serve" and "aideck export"; edit the source instead.\`];
  }
  return undefined;
}

/** Roots of the workspace owning this file, but only once an installer has recorded one. */
function installedWorkspaceFor(file) {
  let directory = dirname(file);
  while (true) {
    const pointer = join(directory, "ai-deck-kit.json");
    if (existsSync(pointer)) {
      try {
        const declared = JSON.parse(readFileSync(pointer, "utf8"));
        const engine = resolve(directory, declared.engineRoot ?? "engine");
        // No manifest means no installer ran here — the kit's own repository, where engine edits
        // are the work. Stay out of the way.
        if (!existsSync(join(engine, ".engine-integrity.json"))) return undefined;
        return { root: directory, engine, decks: resolve(directory, declared.decksRoot ?? "decks") };
      } catch {
        return undefined;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

function isInside(root, file) {
  const path = relative(root, file);
  return path !== "" && !path.startsWith("..") && !path.startsWith("/");
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}
`;
}
