import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
        throw error;
    }
}
