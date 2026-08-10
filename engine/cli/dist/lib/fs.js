import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
export function readJson(file) {
    try {
        return JSON.parse(readFileSync(file, "utf8"));
    }
    catch (error) {
        throw new Error(`Could not read valid JSON: ${file}\n${error instanceof Error ? error.message : String(error)}`);
    }
}
export function writeJson(file, value) {
    writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}
export function writeText(file, value) {
    mkdirSync(dirname(file), { recursive: true });
    const temporary = `${file}.tmp-${process.pid}`;
    writeFileSync(temporary, value, "utf8");
    renameSync(temporary, file);
}
export function copyTree(source, destination, excluded = new Set([".build", "storybook-static"])) {
    if (!existsSync(source))
        throw new Error(`Source does not exist: ${source}`);
    cpSync(source, destination, {
        recursive: true,
        filter: (entry) => {
            const name = entry.split("/").at(-1) ?? "";
            return !excluded.has(name) && name !== "node_modules";
        },
    });
}
/**
 * One sha256 per file, keyed by path relative to `root` with "/" separators. Comparing two of these
 * says whether one tree was copied from the other and left alone — how a deck's frozen template
 * snapshot and an installed engine are both checked for edits.
 */
export function hashTree(root, options = {}) {
    const excludedNames = options.excludedNames ?? new Set([".build", "storybook-static", "node_modules", ".DS_Store"]);
    const excludedPaths = options.excludedPaths ?? new Set();
    const files = {};
    if (existsSync(root))
        collectHashes(root, root, excludedNames, excludedPaths, files);
    return files;
}
function collectHashes(root, directory, excludedNames, excludedPaths, files) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (excludedNames.has(entry.name))
            continue;
        const path = join(directory, entry.name);
        const key = relative(root, path).split(sep).join("/");
        if (excludedPaths.has(key))
            continue;
        // Symlinks are neither file nor directory here, so they are skipped: agent homes link INTO these
        // trees, never the other way round, and a link's target is hashed on its own.
        if (entry.isDirectory())
            collectHashes(root, path, excludedNames, excludedPaths, files);
        else if (entry.isFile())
            files[key] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
}
export function removeTree(target) {
    rmSync(resolve(target), { recursive: true, force: true });
}
export function replaceTree(source, destination) {
    const target = resolve(destination);
    const staging = `${target}.staging-${process.pid}`;
    const backup = `${target}.backup-${process.pid}`;
    removeTree(staging);
    copyTree(source, staging);
    try {
        if (existsSync(target))
            renameSync(target, backup);
        renameSync(staging, target);
        removeTree(backup);
    }
    catch (error) {
        removeTree(staging);
        if (existsSync(backup) && !existsSync(target))
            renameSync(backup, target);
        const message = error instanceof Error ? error.message : String(error);
        // If the rollback could not put the original back, the only copy of it is the backup — say where.
        if (existsSync(backup))
            throw new Error(`${message}\nThe previous contents are kept at: ${backup}`);
        throw error;
    }
}
