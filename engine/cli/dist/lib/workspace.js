import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { readJson, writeJson } from "./fs.js";
const POINTER_FILE = "ai-deck-kit.json";
export function findWorkspace(start = process.cwd()) {
    let directory = resolve(start);
    while (true) {
        const pointerPath = join(directory, POINTER_FILE);
        if (existsSync(pointerPath)) {
            const pointer = readJson(pointerPath);
            for (const field of ["engineRoot", "decksRoot", "engineVersion"]) {
                if (!pointer[field] || typeof pointer[field] !== "string") {
                    throw new Error(`${pointerPath}: ${field} must be a non-empty string.`);
                }
            }
            return { root: directory, pointerPath, pointer, engineRoot: resolve(directory, pointer.engineRoot), decksRoot: resolve(directory, pointer.decksRoot) };
        }
        const parent = dirname(directory);
        if (parent === directory)
            break;
        directory = parent;
    }
    throw new Error(`No ${POINTER_FILE} found from ${resolve(start)} upward. Run "aideck init" first.`);
}
export function writePointer(root, pointer) {
    const pointerPath = join(root, POINTER_FILE);
    writeJson(pointerPath, pointer);
    return pointerPath;
}
export function resolveWorkspacePath(workspace, target) {
    return isAbsolute(target) ? resolve(target) : resolve(workspace.root, target);
}
export function ensureWorkspaceDirs(workspace) {
    mkdirSync(workspace.decksRoot, { recursive: true });
    mkdirSync(join(workspace.root, "templates"), { recursive: true });
}
