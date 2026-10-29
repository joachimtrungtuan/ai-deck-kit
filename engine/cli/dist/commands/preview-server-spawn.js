import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { deckPath } from "../lib/deck.js";
import { listTemplates, resolveTemplate } from "../lib/templates.js";
/** Runs the shared Vite preview runtime against a deck or template, blocking until it exits. */
export function spawnPreviewServer(workspace, target) {
    const vite = join(workspace.engineRoot, "node" + "_modules", ".bin", "vite");
    if (!existsSync(vite))
        throw new Error(`Vite executable missing: ${vite}`);
    const deckPathKey = "AIDECK_DECK" + "_PATH";
    const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
    const engineRootKey = "AIDECK_ENGINE" + "_ROOT";
    const galleryKey = "AIDECK_TEMPLATE" + "_GALLERY";
    const result = spawnSync(vite, target.viteArgs, {
        cwd: workspace.engineRoot,
        stdio: "inherit",
        env: {
            ...process.env,
            [deckPathKey]: target.deckRoot,
            [templatePathKey]: target.templateRoot,
            [engineRootKey]: workspace.engineRoot,
            // The gallery renders exactly what this project can resolve — never a hardcoded shipped set.
            [galleryKey]: JSON.stringify(galleryEntries(workspace)),
        },
    });
    if (result.status !== 0)
        throw new Error(`Preview server exited with code ${result.status ?? 1}.`);
}
/** Templates the preview may show, resolved through the same precedence every other command uses. */
function galleryEntries(workspace) {
    return listTemplates(workspace).flatMap((entry) => {
        try {
            resolveTemplate(workspace, entry.name);
        }
        catch {
            return []; // A broken bundle is reported by `template validate`; it must not break the gallery.
        }
        return [{ name: entry.name, root: entry.root, origin: entry.origin }];
    });
}
export function resolveDeckForServe(workspace, deck) {
    const root = deckPath(workspace, deck);
    if (existsSync(join(root, "deck.json")))
        return root;
    const templateMatch = listTemplates(workspace).find((entry) => entry.name === deck);
    if (templateMatch)
        throw new Error(`"${deck}" is a template, not a deck. Run: aideck serve template ${deck}`);
    const available = existsSync(workspace.decksRoot)
        ? readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")).map((entry) => entry.slice(0, -".deck".length))
        : [];
    const hint = available.length ? ` Available decks: ${available.join(", ")}.` : " This project has no decks yet.";
    throw new Error(`Deck not found: ${root}.${hint}`);
}
