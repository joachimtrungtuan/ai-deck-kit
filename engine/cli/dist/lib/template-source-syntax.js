// Syntax-checks the code a template author writes: layout components and the bundle's stylesheets.
//
// The manifest validator proves those files exist and are wired up; this proves they parse. A
// template that does not parse fails at preview time with a stack trace far from the edit, which is
// exactly the kind of breakage the verifier hook exists to catch while the agent is still working.
//
// Uses esbuild, already installed for the preview build. If it cannot be resolved the check reports
// nothing rather than failing: a missing parser is not a broken template.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, relative, sep } from "node:path";
const LOADERS = { ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js", ".mjs": "js", ".css": "css" };
const SKIPPED = new Set(["node_modules", ".build", "storybook-static"]);
export function templateSourceErrors(bundleRoot, engineRoot) {
    const transform = loadTransform(engineRoot);
    if (!transform)
        return [];
    const errors = [];
    for (const file of sourceFiles(bundleRoot)) {
        try {
            transform(readFileSync(file, "utf8"), { loader: LOADERS[extname(file)], sourcefile: file });
        }
        catch (error) {
            errors.push(`${relative(bundleRoot, file).split(sep).join("/")}: ${firstMessage(error)}`);
        }
    }
    return errors;
}
function loadTransform(engineRoot) {
    try {
        return createRequire(join(engineRoot, "package.json"))("esbuild").transformSync;
    }
    catch {
        return undefined;
    }
}
function sourceFiles(root, found = []) {
    if (!existsSync(root))
        return found;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (SKIPPED.has(entry.name))
            continue;
        const path = join(root, entry.name);
        if (entry.isDirectory())
            sourceFiles(path, found);
        else if (entry.isFile() && extname(entry.name) in LOADERS)
            found.push(path);
    }
    return found;
}
/** esbuild reports every problem it found; the first one is where the file stopped making sense. */
function firstMessage(error) {
    const first = error.errors?.[0];
    if (!first?.text)
        return error instanceof Error ? error.message : String(error);
    return first.location?.line ? `${first.text} (line ${first.location.line})` : first.text;
}
