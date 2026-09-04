// Wiring the engine's skill bundles into an agent's skills directory.
//
// The engine ships skills under engine/skills/, but an agent only discovers them
// through a well-known home such as .claude/ or .agents/. When the kit is installed
// at a project root those homes sit right there; when it is installed deep in a
// subfolder they usually live further up, so discovery walks toward the filesystem
// root and the user confirms before anything is written.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
/** Agent homes we know how to wire, in the order they are offered. */
const AGENT_HOME_NAMES = [".claude", ".agents"];
/**
 * Find agent homes at `startDir`, then in each ancestor.
 * `distance` is how many levels up the home was found — 0 means "right here".
 */
export function findAgentHomes(startDir) {
    const homes = [];
    let directory = resolve(startDir);
    let distance = 0;
    while (true) {
        for (const name of AGENT_HOME_NAMES) {
            const candidate = join(directory, name);
            if (existsSync(candidate) && lstatSync(candidate).isDirectory())
                homes.push({ path: candidate, name, distance });
        }
        const parent = dirname(directory);
        if (parent === directory)
            break;
        directory = parent;
        distance += 1;
    }
    return homes;
}
/** Validate a user-supplied agent home. Accepts the home itself or its parent project. */
export function resolveAgentHome(input, base) {
    const candidate = resolve(base, input);
    if (!existsSync(candidate))
        throw new Error(`That path does not exist: ${candidate}`);
    if (!lstatSync(candidate).isDirectory())
        throw new Error(`That path is not a folder: ${candidate}`);
    const name = candidate.split("/").at(-1) ?? "";
    if (AGENT_HOME_NAMES.includes(name))
        return { path: candidate, name, distance: 0 };
    // A project folder was given — accept it if it already contains an agent home.
    for (const home of AGENT_HOME_NAMES) {
        const nested = join(candidate, home);
        if (existsSync(nested))
            return { path: nested, name: home, distance: 0 };
    }
    throw new Error(`No ${AGENT_HOME_NAMES.join(" or ")} folder found in ${candidate}. Give the path to the agent folder itself, or to a project that contains one.`);
}
/**
 * Link every engine skill into `<home>/skills/`.
 * Existing links to the same source are left alone; unrelated real folders are
 * never overwritten, so a user's own skill of the same name survives.
 */
export function wireSkills(engineRoot, home) {
    const source = join(engineRoot, "skills");
    if (!existsSync(source))
        throw new Error(`Engine has no skills directory: ${source}`);
    const target = join(home.path, "skills");
    mkdirSync(target, { recursive: true });
    const linked = [];
    const skipped = [];
    for (const entry of readdirSync(source, { withFileTypes: true })) {
        if (!entry.isDirectory())
            continue;
        const skillSource = join(source, entry.name);
        const skillTarget = join(target, entry.name);
        if (existsSync(skillTarget) || isBrokenLink(skillTarget)) {
            if (!isManagedLink(skillTarget, skillSource)) {
                skipped.push(entry.name);
                continue;
            }
            rmSync(skillTarget, { recursive: true, force: true });
        }
        link(skillSource, skillTarget);
        linked.push(entry.name);
    }
    return { home: target, linked, skipped };
}
/**
 * Remove every skill link `wireSkills` created in `<home>/skills/`, leaving anything else alone —
 * a user's own real folder of the same name is never touched. Works even after the engine tree
 * itself is gone (`aideck uninstall`), since a managed link is identified by where it points, not
 * by that target existing.
 */
export function unwireSkills(engineRoot, home) {
    const source = join(engineRoot, "skills");
    const target = join(home.path, "skills");
    if (!existsSync(target))
        return [];
    const removed = [];
    for (const entry of readdirSync(target, { withFileTypes: true })) {
        const skillTarget = join(target, entry.name);
        if (!isManagedLink(skillTarget, join(source, entry.name)))
            continue;
        rmSync(skillTarget, { recursive: true, force: true });
        removed.push(entry.name);
    }
    return removed;
}
/** True when the path is a symlink that already resolves to this engine's skill. */
function isManagedLink(path, expectedSource) {
    try {
        if (!lstatSync(path).isSymbolicLink())
            return false;
        return resolve(dirname(path), readlinkSync(path)) === resolve(expectedSource);
    }
    catch {
        return false;
    }
}
function isBrokenLink(path) {
    try {
        return lstatSync(path).isSymbolicLink();
    }
    catch {
        return false;
    }
}
/** Relative symlink so the project stays movable; copy where symlinks are unavailable. */
function link(source, target) {
    try {
        symlinkSync(relative(dirname(target), source), target, "dir");
    }
    catch {
        cpSync(source, target, { recursive: true });
    }
}
