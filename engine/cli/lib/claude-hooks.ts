// Registering a hook script in a `.claude` home, without disturbing what is already there.
//
// Two hooks share this: the write guard (`claude-engine-guard.ts`) and the pass verifier
// (`claude-verify-hook.ts`). Both write a script into `<claudeHome>/hooks/` and add one entry to
// `settings.json`; the settings file belongs to the user, so an existing registration is left alone
// and unrelated hooks are preserved.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readJson, writeJson, writeText } from "./fs.ts";

type HookEntry = { type?: string; command?: string };
type HookMatcher = { matcher?: string; hooks?: HookEntry[] };
type ClaudeSettings = { hooks?: Record<string, HookMatcher[]>; [key: string]: unknown };

export type HookInstall = { claudeHome: string; event: string; file: string; script: string; matcher?: string };

export type HookInstallResult = { status: "installed" | "unchanged"; hookPath: string; settingsPath: string };

/** The script is always rewritten so an upgraded kit ships its current version; only the registration is idempotent. */
export function installClaudeHook({ claudeHome, event, file, script, matcher }: HookInstall): HookInstallResult {
  const hookPath = join(claudeHome, "hooks", file);
  const settingsPath = join(claudeHome, "settings.json");
  writeText(hookPath, script);

  const settings: ClaudeSettings = existsSync(settingsPath) ? readJson<ClaudeSettings>(settingsPath) : {};
  const hooks = settings.hooks ?? {};
  const registered = hooks[event] ?? [];
  const command = `node "${hookPath}"`;
  if (registered.some((entry) => entry.hooks?.some((hook) => hook.command === command))) {
    return { status: "unchanged", hookPath, settingsPath };
  }
  const entry: HookMatcher = matcher ? { matcher, hooks: [{ type: "command", command }] } : { hooks: [{ type: "command", command }] };
  writeJson(settingsPath, { ...settings, hooks: { ...hooks, [event]: [...registered, entry] } });
  return { status: "installed", hookPath, settingsPath };
}

/**
 * Whether this home already runs the hook. Consent was given once; a registration found here means
 * the script can be refreshed by a later upgrade without asking again.
 */
export function isClaudeHookRegistered(claudeHome: string, event: string, file: string): boolean {
  const settingsPath = join(claudeHome, "settings.json");
  if (!existsSync(settingsPath)) return false;
  const command = `node "${join(claudeHome, "hooks", file)}"`;
  return (readJson<ClaudeSettings>(settingsPath).hooks?.[event] ?? []).some((entry) => entry.hooks?.some((hook) => hook.command === command));
}
