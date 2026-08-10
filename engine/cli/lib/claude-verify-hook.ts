// A Claude Code hook that verifies the workspace when the agent finishes a pass of editing.
//
// The write guard refuses one bad path at a time; this checks the result as a whole, because the
// damaging outcomes are states, not single writes: a template edited inside a deck's frozen copy, a
// deck whose content no longer validates, a layout that stopped parsing. Editing is when those
// appear, so the check runs at the end of every editing pass rather than on demand — by then the
// agent has usually moved on, and a stale deck is discovered by whoever opens the preview.
//
// It runs `aideck verify`, which is read-only and does no machine probing, and exits 2 on failure so
// the agent has to fix what it broke before it can finish.
import { installClaudeHook, isClaudeHookRegistered, type HookInstallResult } from "./claude-hooks.ts";

const HOOK_FILE = "aideck-verify.mjs";

/** Write the verifier script and register it as a `Stop` hook in `<claudeHome>/settings.json`. */
export function installClaudeVerifyHook(claudeHome: string): HookInstallResult {
  return installClaudeHook({ claudeHome, event: "Stop", file: HOOK_FILE, script: verifyScript() });
}

export function claudeVerifyHookRegistered(claudeHome: string): boolean {
  return isClaudeHookRegistered(claudeHome, "Stop", HOOK_FILE);
}

/**
 * Like the write guard, the script resolves the workspace at run time and stays silent unless the
 * engine carries an installer-written integrity manifest — which is what keeps it inert inside the
 * kit's own repository, and harmless in every project that never installed the kit.
 */
function verifyScript(): string {
  return `#!/usr/bin/env node
// Installed by AI Deck Kit ("aideck skills wire"). Runs "aideck verify" when the agent finishes.
// Delete this file and its entry in settings.json to remove it.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const payload = await readStdin();
// Set when this stop already followed a stop hook. Continuing to block would loop.
if (payload?.stop_hook_active) process.exit(0);

const workspace = installedWorkspaceFor(resolve(payload?.cwd ?? process.cwd()));
if (!workspace) process.exit(0);
const cli = join(workspace.engine, "cli", "index.mjs");
if (!existsSync(cli)) process.exit(0);

const result = spawnSync(process.execPath, [cli, "verify"], { cwd: workspace.root, encoding: "utf8" });
if (result.status === 0) process.exit(0);

console.error(
  [
    "The presentation workspace does not check out after this pass:",
    "",
    \`\${result.stdout ?? ""}\${result.stderr ?? ""}\`.trim(),
    "",
    "Fix these before finishing. Templates are edited in templates/{name}.template/, deck words in",
    "decks/{slug}.deck/content.md; deck.json, a deck's template/ copy and the engine are not yours to edit.",
  ].join("\\n"),
);
process.exit(2);

/** Roots of the workspace containing this directory, but only once an installer has recorded one. */
function installedWorkspaceFor(start) {
  let directory = start;
  while (true) {
    const pointer = join(directory, "ai-deck-kit.json");
    if (existsSync(pointer)) {
      try {
        const declared = JSON.parse(readFileSync(pointer, "utf8"));
        const engine = resolve(directory, declared.engineRoot ?? "engine");
        return existsSync(join(engine, ".engine-integrity.json")) ? { root: directory, engine } : undefined;
      } catch {
        return undefined;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
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
