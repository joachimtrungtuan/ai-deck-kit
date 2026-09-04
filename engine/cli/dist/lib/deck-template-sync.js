// Compares each deck's frozen template snapshot against the template it came from, and re-syncs it.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { copyTree, hashTree, readJson, removeTree, writeJson } from "./fs.js";
import { writeDeckSchemaGuidance } from "./schema-guidance.js";
import { findTemplate } from "./templates.js";
export function deckBundles(workspace) {
    if (!existsSync(workspace.decksRoot))
        return [];
    return readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")).sort();
}
/** Read-only comparison. Never throws for a deck it cannot classify — it reports the problem instead. */
export function deckDrift(workspace, bundle) {
    const manifest = readJson(join(workspace.decksRoot, bundle, "deck.json"));
    const templateName = manifest.template?.set ?? "";
    const deckVersion = manifest.template?.version ?? "";
    const base = { slug: manifest.slug ?? bundle, bundle, templateName, deckVersion };
    const source = templateName ? findTemplate(workspace, templateName) : undefined;
    if (!source)
        return { ...base, state: "source-missing", detail: `source template "${templateName}" no longer exists` };
    const sourceVersion = source.manifest.templateVersion;
    const found = { ...base, sourceVersion, sourceOrigin: source.origin };
    if (!manifest.template.origin) {
        return { ...found, state: "unknown-origin", detail: `created before origin was recorded; now resolves to the ${source.origin} template at ${sourceVersion}` };
    }
    if (manifest.template.origin !== source.origin) {
        return { ...found, state: "source-switched", detail: `source changed ${manifest.template.origin} → ${source.origin}` };
    }
    const comparison = compareVersions(deckVersion, sourceVersion);
    if (comparison < 0)
        return { ...found, state: "behind", detail: `${deckVersion} → ${sourceVersion}` };
    if (comparison > 0)
        return { ...found, state: "ahead", detail: `deck ${deckVersion} is newer than source ${sourceVersion}` };
    return { ...found, state: "current", detail: sourceVersion };
}
/**
 * Files in a deck's frozen template snapshot that no longer match the template they were copied
 * from. The snapshot is CLI-owned — it is written whole and never touched again — so at a matching
 * version any difference is a template edit made in the wrong place, inside the deck.
 *
 * Only meaningful while the deck sits at the source's version: once it is behind or ahead the two
 * trees are expected to differ, and an edit hides among the legitimate differences.
 */
export function snapshotEdits(workspace, bundle) {
    const drift = deckDrift(workspace, bundle);
    if (drift.state !== "current")
        return [];
    const source = findTemplate(workspace, drift.templateName);
    if (!source)
        return [];
    const snapshot = hashTree(join(workspace.decksRoot, bundle, "template"));
    const original = hashTree(source.root);
    return [...new Set([...Object.keys(snapshot), ...Object.keys(original)])].filter((file) => snapshot[file] !== original[file]).sort();
}
export function describeDrift(drift) {
    return drift.state === "current" ? `current (${drift.detail})` : `${drift.state} (${drift.detail})`;
}
/**
 * Replace a deck's frozen template snapshot with the current source bundle. Refuses when the target
 * cannot render a slide type the deck already uses — the only structural guarantee the CLI can make.
 * Everything below that (layout fit, renamed tokens, overflow) is the agent's to verify afterwards.
 *
 * Also refuses when the source template consumes a different content-schema major than the deck's
 * content was authored for. In either direction, the re-synced components would be fed props shaped
 * for another schema and could silently render broken content.
 */
export function retemplateDeck(deckRoot, template) {
    const manifestPath = join(deckRoot, "deck.json");
    const manifest = readJson(manifestPath);
    const supported = new Set(template.manifest.supportedSlideTypes ?? []);
    const unsupported = (manifest.slides ?? []).filter((slide) => !supported.has(slide.type));
    if (unsupported.length) {
        throw new Error([
            `Template "${template.manifest.name}" does not support every slide type this deck uses:`,
            ...unsupported.map((slide) => `- ${slide.id} (${slide.type})`),
            `Change those slides first, or choose a template that declares these types.`,
        ].join("\n"));
    }
    const deckSchema = manifest.contentSchemaVersion ?? "3.0.0";
    const templateSchema = template.manifest.contentSchemaVersion ?? "3.0.0";
    if (majorPart(deckSchema) !== majorPart(templateSchema)) {
        throw new Error([
            `Refusing: deck "${manifest.slug ?? deckRoot}" is on content schema ${deckSchema}, but template "${template.manifest.name}" ${template.manifest.templateVersion} consumes ${templateSchema}.`,
            `Retemplating would replace the deck's frozen snapshot with components expecting ${templateSchema} props while its content remains ${deckSchema}-shaped.`,
            `Use a template on the same content-schema major, or run an explicit agent-led schema migration first.`,
        ].join("\n"));
    }
    const from = manifest.template.version;
    const to = template.manifest.templateVersion;
    const snapshot = join(deckRoot, "template");
    const backup = `${snapshot}.backup-${process.pid}`;
    removeTree(backup);
    if (existsSync(snapshot))
        copyTree(snapshot, backup);
    try {
        removeTree(snapshot);
        copyTree(template.root, snapshot);
    }
    catch (error) {
        if (existsSync(backup)) {
            removeTree(snapshot);
            copyTree(backup, snapshot);
        }
        throw error;
    }
    removeTree(backup);
    manifest.template = { set: template.manifest.name, version: to, origin: template.origin };
    manifest.slideTypeCatalog = template.manifest.slideTypeCatalog;
    manifest.blockCatalog = template.manifest.blockCatalog ?? manifest.blockCatalog;
    writeJson(manifestPath, manifest);
    writeDeckSchemaGuidance(deckRoot, manifest);
    return { deckRoot, templateName: template.manifest.name, from, to, origin: template.origin, majorChange: majorPart(from) !== majorPart(to) };
}
function majorPart(version) {
    return version.split(".")[0] ?? "";
}
function compareVersions(left, right) {
    const toParts = (value) => value.split(".").map((part) => Number.parseInt(part, 10) || 0);
    const a = toParts(left);
    const b = toParts(right);
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
        const difference = (a[index] ?? 0) - (b[index] ?? 0);
        if (difference !== 0)
            return difference < 0 ? -1 : 1;
    }
    return 0;
}
