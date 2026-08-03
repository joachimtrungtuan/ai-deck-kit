#!/usr/bin/env node
import { runCatalog, catalogHelp } from "./commands/catalog.js";
import { coreHelp, runCore } from "./commands/core.js";
import { deckHelp, runDeck } from "./commands/deck-maintenance.js";
import { removalHelp, runRemoval } from "./commands/removal.js";
import { generationHelp, runGeneration } from "./commands/generation.js";
import { linkHelp, runLink } from "./commands/link.js";
import { outputHelp, runOutput } from "./commands/output.js";
import { presentationHelp, runPresentation } from "./commands/presentation.js";
import { runSkills, skillsHelp } from "./commands/wire-skills.js";
import { runTemplates, templateHelp } from "./commands/templates.js";
export const VERSION = "0.1.0";
const help = `AI Deck Kit (${VERSION}) — deterministic presentation toolkit

Usage: aideck <command> [options]

${coreHelp}

${linkHelp}

${skillsHelp}

${presentationHelp}

${deckHelp}

${templateHelp}

${removalHelp}

${catalogHelp}

${generationHelp}

${outputHelp}`;
export function main(argv = process.argv.slice(2)) {
    const [command, ...args] = argv;
    if (!command || command === "--help" || command === "help") {
        console.log(help);
        return;
    }
    if (command === "--version" || command === "version") {
        console.log(VERSION);
        return;
    }
    if (command === "init" || command === "upgrade" || command === "doctor" || command === "config" || command === "list")
        return runCore([command, ...args]);
    if (command === "link" || command === "unlink")
        return runLink([command, ...args]);
    if (command === "skills")
        return runSkills(args);
    if (command === "new" || command === "slide" || command === "anim" || command === "transition" || command === "validate")
        return runPresentation([command, ...args]);
    if (command === "deck")
        return runDeck(args);
    if (command === "template")
        return runTemplates(args);
    if (command === "remove" || command === "uninstall" || command === "reinstall")
        return runRemoval([command, ...args]);
    if (command === "blocks" || command === "motion" || command === "tokens")
        return runCatalog([command, ...args]);
    if (command === "gen")
        return runGeneration(args);
    if (command === "serve" || command === "export" || command === "pack" || command === "unpack")
        return runOutput([command, ...args]);
    throw new Error(`Unknown command: ${command}. Run "aideck --help" for usage.`);
}
try {
    main();
}
catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
