// Registering a hook script in a `.claude` home, without disturbing what is already there.
//
// Two hooks share this: the write guard (`claude-engine-guard.ts`) and the pass verifier
// (`claude-verify-hook.ts`). Both write a script into `<claudeHome>/hooks/` and add one entry to
// `settings.json`; the settings file belongs to the user, so an existing registration is left alone
// and unrelated hooks are preserved.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { readJson, writeJson, writeText } from "./fs.js";
/** The script is always rewritten so an upgraded kit ships its current version; only the registration is idempotent. */
export function installClaudeHook({ claudeHome, event, file, script, matcher, useProjectDirVar }) {
    const hookPath = join(claudeHome, "hooks", file);
    const settingsPath = join(claudeHome, "settings.json");
    writeText(hookPath, script);
    const settings = existsSync(settingsPath) ? readJson(settingsPath) : {};
    const hooks = settings.hooks ?? {};
    const registered = hooks[event] ?? [];
    const command = useProjectDirVar ? `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${file}"` : `node "${hookPath}"`;
    const entry = matcher ? { matcher, hooks: [{ type: "command", command }] } : { hooks: [{ type: "command", command }] };
    // A prior registration of this hook file — the current command, or a stale one left by an older
    // install or a different machine path — is replaced in place instead of duplicated.
    const withoutStale = registered.filter((existing) => !referencesHookFile(existing, file));
    const removedCount = registered.length - withoutStale.length;
    const unchanged = removedCount === 1 && registered.some((existing) => sameEntry(existing, entry));
    if (unchanged) {
        return { status: "unchanged", hookPath, settingsPath };
    }
    writeJson(settingsPath, { ...settings, hooks: { ...hooks, [event]: [...withoutStale, entry] } });
    return { status: "installed", hookPath, settingsPath };
}
/**
 * Whether this home already runs the hook, on this path or any other — matched by hook filename so
 * a registration surviving from a different machine still counts. Consent was given once; a
 * registration found here means the script can be refreshed by a later upgrade without asking again.
 */
export function isClaudeHookRegistered(claudeHome, event, file) {
    const settingsPath = join(claudeHome, "settings.json");
    if (!existsSync(settingsPath))
        return false;
    return (readJson(settingsPath).hooks?.[event] ?? []).some((entry) => referencesHookFile(entry, file));
}
/**
 * Undo `installClaudeHook`: drop the file's entry from `settings.json` (removing the event key
 * entirely once empty) and delete the script. A settings file with no registration for this file,
 * or none at all, is left untouched — there is nothing to undo.
 */
export function uninstallClaudeHook(claudeHome, event, file) {
    const hookPath = join(claudeHome, "hooks", file);
    const settingsPath = join(claudeHome, "settings.json");
    let changed = false;
    if (existsSync(settingsPath)) {
        const settings = readJson(settingsPath);
        const registered = settings.hooks?.[event] ?? [];
        const withoutStale = registered.filter((existing) => !referencesHookFile(existing, file));
        if (withoutStale.length !== registered.length) {
            const hooks = { ...settings.hooks };
            if (withoutStale.length)
                hooks[event] = withoutStale;
            else
                delete hooks[event];
            writeJson(settingsPath, { ...settings, hooks });
            changed = true;
        }
    }
    if (existsSync(hookPath)) {
        rmSync(hookPath);
        changed = true;
    }
    return changed;
}
function referencesHookFile(entry, file) {
    return entry.hooks?.some((hook) => typeof hook.command === "string" && hook.command.endsWith(`/hooks/${file}"`)) ?? false;
}
function sameEntry(a, b) {
    return a.matcher === b.matcher && JSON.stringify(a.hooks) === JSON.stringify(b.hooks);
}
