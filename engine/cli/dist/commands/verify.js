// Everything the kit can check about a workspace by reading it — no machine probing, no writes.
//
// `doctor` prints this after its prerequisite checks, and the agent verifier hook runs it at the end
// of every editing pass. That second caller is why it stays read-only and free of subprocesses other
// than the deck validator: it runs constantly, and anything slow or mutating here would be felt.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readJson } from "../lib/fs.js";
import { deckBundles, deckDrift, describeDrift, snapshotEdits } from "../lib/deck-template-sync.js";
import { describeEngineDrift, engineDrift, hasEngineDrift } from "../lib/engine-integrity.js";
import { previewRuntimeBinary, previewRuntimeReady } from "../lib/engine-dependencies.js";
import { projectTemplatesRoot, validateTemplateBundle } from "../lib/templates.js";
import { templateSourceErrors } from "../lib/template-source-syntax.js";
/** How many changed files to name before summarising; keeps a bulk edit from flooding the caller. */
const MAX_LISTED = 20;
export function verifyWorkspace(workspace) {
    const errors = [];
    const notes = [];
    if (!existsSync(workspace.engineRoot))
        errors.push(`Engine root missing: ${workspace.engineRoot}`);
    if (!existsSync(workspace.decksRoot))
        errors.push(`Decks root missing: ${workspace.decksRoot}`);
    if (existsSync(workspace.engineRoot) && !previewRuntimeReady(workspace.engineRoot)) {
        errors.push(`Preview runtime is not installed (${previewRuntimeBinary(workspace.engineRoot)} is missing). Run "aideck reinstall".`);
    }
    checkEngine(workspace, errors);
    const version = checkEngineVersion(workspace, errors);
    const templates = checkTemplates(workspace, errors);
    const decks = deckBundles(workspace);
    decks.forEach((bundle) => checkDeck(workspace, bundle, version, errors, notes));
    checkStrays(workspace, errors);
    return { errors, notes, decks: decks.length, templates };
}
export function verifyCommand(workspace) {
    const report = verifyWorkspace(workspace);
    printVerifyReport(report);
    if (report.errors.length)
        process.exitCode = 1;
}
export function printVerifyReport(report) {
    if (report.notes.length) {
        console.log("Templates that moved on since a deck was created:");
        report.notes.forEach((note) => console.log(`- ${note}`));
        console.log("");
    }
    if (report.errors.length) {
        console.error("Found problems:");
        report.errors.forEach((error) => console.error(`- ${error}`));
        return;
    }
    console.log(`Verified: ${report.templates} template${report.templates === 1 ? "" : "s"}, ${report.decks} deck${report.decks === 1 ? "" : "s"}.`);
}
/**
 * Name every file edited inside the installed engine. This is the only place such an edit surfaces:
 * `init` gitignores the engine, so git never shows it, and `upgrade` replaces the tree wholesale.
 * Silent when no integrity manifest exists — that is the kit's own repository, where engine edits
 * are the work.
 */
function checkEngine(workspace, errors) {
    const drift = engineDrift(workspace.engineRoot);
    if (!hasEngineDrift(drift))
        return;
    errors.push([
        "The installed engine has been edited. Upgrading replaces the whole engine folder, so these changes will be lost:",
        ...listed(describeEngineDrift(drift)).map((line) => `    ${line}`),
        "  Template work belongs in templates/, deck work in decks/. If the change genuinely belongs",
        "  in the engine, report it to the AI Deck Kit project instead.",
    ].join("\n"));
}
function checkEngineVersion(workspace, errors) {
    const versionPath = join(workspace.engineRoot, "engine.version.json");
    if (!existsSync(versionPath)) {
        errors.push(`Engine version file missing: ${versionPath}`);
        return {};
    }
    const version = readJson(versionPath);
    if (version.engineVersion !== workspace.pointer.engineVersion) {
        errors.push(`Version mismatch: pointer=${workspace.pointer.engineVersion}, engine=${version.engineVersion}`);
    }
    return version;
}
/** Every user-authored bundle must validate. Shipped bundles are engine files and covered above. */
function checkTemplates(workspace, errors) {
    const root = projectTemplatesRoot(workspace);
    if (!existsSync(root))
        return 0;
    const bundles = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.endsWith(".template"));
    for (const bundle of bundles) {
        const bundleRoot = join(root, bundle.name);
        if (!existsSync(join(bundleRoot, "template-manifest.json"))) {
            errors.push(`templates/${bundle.name}: no template-manifest.json — not a usable template bundle.`);
            continue;
        }
        try {
            validateTemplateBundle(bundleRoot).forEach((error) => errors.push(`templates/${bundle.name}: ${error}`));
            templateSourceErrors(bundleRoot, workspace.engineRoot).forEach((error) => errors.push(`templates/${bundle.name}/${error}`));
        }
        catch (error) {
            errors.push(`templates/${bundle.name}: ${message(error)}`);
        }
    }
    return bundles.length;
}
function checkDeck(workspace, bundle, version, errors, notes) {
    const deckRoot = join(workspace.decksRoot, bundle);
    try {
        const manifest = readJson(join(deckRoot, "deck.json"));
        if (!manifest.slug || !manifest.template?.set || !manifest.template.version)
            errors.push(`${bundle}: incomplete deck manifest.`);
        if (!existsSync(join(deckRoot, "content.md")))
            errors.push(`${bundle}: content.md missing.`);
        if (version.contentSchemaVersion && manifest.contentSchemaVersion !== version.contentSchemaVersion)
            errors.push(`${bundle}: unsupported content schema ${manifest.contentSchemaVersion ?? "missing"}.`);
        if (version.supportedSlideTypeCatalogs && manifest.slideTypeCatalog && !isSupportedSlideTypeCatalog(manifest.slideTypeCatalog, version.supportedSlideTypeCatalogs, manifest.template?.set)) {
            errors.push(`${bundle}: unsupported slide-type catalog ${manifest.slideTypeCatalog}.`);
        }
        if (manifest.template?.set)
            checkDeckTemplate(workspace, bundle, errors, notes);
        checkDeckContent(workspace, deckRoot, bundle, errors);
    }
    catch (error) {
        errors.push(`${bundle}: ${message(error)}`);
    }
}
/**
 * A deck's catalog is either a general engine catalog (v1/v2) or a named, versioned profile scoped to
 * its own template — the documented pattern (template-system.md) for a template whose use case is
 * narrower than the general catalog. `template.set` is always the name of the template that produced
 * the deck (deck-template-sync copies it verbatim), so this can only ever match a profile that exact
 * template declared for itself, never an arbitrary string.
 */
function isSupportedSlideTypeCatalog(catalog, supported, templateName) {
    if (supported.includes(catalog))
        return true;
    return !!templateName && new RegExp(`^${templateName}-v\\d+$`).test(catalog);
}
function checkDeckTemplate(workspace, bundle, errors, notes) {
    // A deck renders from its own frozen snapshot, so trailing the source template is news, not damage.
    const drift = deckDrift(workspace, bundle);
    if (drift.state === "source-missing") {
        errors.push(`${bundle}: ${drift.detail}. Run "aideck deck retemplate ${drift.slug} --to <template>".`);
        return;
    }
    // Ahead means the snapshot claims a version the source never published — a template edited inside
    // the deck and bumped there, which the next retemplate silently discards.
    if (drift.state === "ahead") {
        errors.push(`${bundle}: ${drift.detail}. Templates are edited in templates/${drift.templateName}.template, never inside a deck.`);
        return;
    }
    if (drift.state !== "current") {
        notes.push(`${bundle}: template ${drift.templateName} is ${describeDrift(drift)}. Run "aideck deck retemplate ${drift.slug}" when you are ready.`);
        return;
    }
    const edits = snapshotEdits(workspace, bundle);
    if (!edits.length)
        return;
    errors.push([
        `${bundle}: its frozen copy of template "${drift.templateName}" no longer matches the template it came from:`,
        ...listed(edits).map((file) => `    ${bundle}/template/${file}`),
        `  Make the change in templates/${drift.templateName}.template, bump templateVersion, then run`,
        `  "aideck deck retemplate ${drift.slug}". Edits inside a deck's template/ are lost on the next sync.`,
    ].join("\n"));
}
/** The canonical content validator, run per deck. Its own output is the error text. */
function checkDeckContent(workspace, deckRoot, bundle, errors) {
    const script = join(workspace.engineRoot, "skills", "presentation-crafting", "scripts", "validate-slide-content.mjs");
    if (!existsSync(script) || !existsSync(join(deckRoot, "content.md")))
        return;
    const result = spawnSync(process.execPath, [script, deckRoot], { encoding: "utf8" });
    if (result.status === 0)
        return;
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    errors.push([`${bundle}: content validation failed.`, ...listed(output.split("\n")).map((line) => `    ${line}`)].join("\n"));
}
/** Loose files beside the bundles: a template or deck edit that landed outside any package. */
function checkStrays(workspace, errors) {
    const roots = [
        [projectTemplatesRoot(workspace), ".template", "templates"],
        [workspace.decksRoot, ".deck", "decks"],
    ];
    for (const [root, suffix, label] of roots) {
        if (!existsSync(root))
            continue;
        const strays = readdirSync(root, { withFileTypes: true })
            .filter((entry) => !entry.name.startsWith(".") && !(entry.isDirectory() && entry.name.endsWith(suffix)))
            .map((entry) => entry.name);
        if (strays.length)
            errors.push(`${label}/: ${strays.join(", ")} — everything here belongs inside a *${suffix} bundle.`);
    }
}
function listed(lines) {
    return lines.length > MAX_LISTED ? [...lines.slice(0, MAX_LISTED), `…and ${lines.length - MAX_LISTED} more`] : lines;
}
function message(error) {
    return error instanceof Error ? error.message : String(error);
}
