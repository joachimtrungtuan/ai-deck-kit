#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCatalog, catalogHelp } from "./commands/catalog.ts";
import { coreHelp, runCore } from "./commands/core.ts";
import { deckHelp, runDeck } from "./commands/deck-maintenance.ts";
import { removalHelp, runRemoval } from "./commands/removal.ts";
import { generationHelp, runGeneration } from "./commands/generation.ts";
import { guidanceHelp, runGuidance } from "./commands/guidance.ts";
import { linkHelp, runLink } from "./commands/link.ts";
import { outputHelp, runOutput } from "./commands/output.ts";
import { presentHelp, runPresent } from "./commands/present.ts";
import { presentationHelp, runPresentation } from "./commands/presentation.ts";
import { runSkills, skillsHelp } from "./commands/wire-skills.ts";
import { runTemplates, templateHelp } from "./commands/templates.ts";

// Read from package.json at runtime (not a TS import) because this file compiles to
// cli/dist/index.js, one directory below the engine root where package.json lives —
// a build-time JSON import would require it inside tsconfig's rootDir.
const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
export const VERSION: string = JSON.parse(readFileSync(packageJsonPath, "utf8")).version;

const help = `AI Deck Kit (${VERSION}) — deterministic presentation toolkit

Usage: aideck <command> [options]

${coreHelp}

${linkHelp}

${skillsHelp}

${guidanceHelp}

${presentationHelp}

${deckHelp}

${templateHelp}

${removalHelp}

${catalogHelp}

${generationHelp}

${outputHelp}

${presentHelp}`;

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "help") {
    console.log(help);
    return;
  }
  if (command === "--version" || command === "version") {
    console.log(VERSION);
    return;
  }
  if (command === "init" || command === "upgrade" || command === "doctor" || command === "verify" || command === "config" || command === "list") return runCore([command, ...args]);
  if (command === "link" || command === "unlink") return runLink([command, ...args]);
  if (command === "skills") return runSkills(args);
  if (command === "guidance") return runGuidance(args);
  if (command === "new" || command === "slide" || command === "anim" || command === "transition" || command === "validate") return runPresentation([command, ...args]);
  if (command === "deck") return runDeck(args);
  if (command === "template") return runTemplates(args);
  if (command === "remove" || command === "uninstall" || command === "reinstall") return runRemoval([command, ...args]);
  if (command === "blocks" || command === "motion" || command === "tokens") return runCatalog([command, ...args]);
  if (command === "gen") return runGeneration(args);
  if (command === "present") return runPresent(args);
  if (command === "serve" || command === "export" || command === "pack" || command === "unpack") return runOutput([command, ...args]);
  throw new Error(`Unknown command: ${command}. Run "aideck --help" for usage.`);
}

try {
  await main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
