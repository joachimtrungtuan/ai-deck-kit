#!/usr/bin/env node
import { runCatalog, catalogHelp } from "./commands/catalog.ts";
import { coreHelp, runCore } from "./commands/core.ts";
import { generationHelp, runGeneration } from "./commands/generation.ts";
import { linkHelp, runLink } from "./commands/link.ts";
import { outputHelp, runOutput } from "./commands/output.ts";
import { presentationHelp, runPresentation } from "./commands/presentation.ts";
import { runSkills, skillsHelp } from "./commands/wire-skills.ts";
import { runTemplates, templateHelp } from "./commands/templates.ts";

export const VERSION = "0.1.0";

const help = `AI Deck Kit (${VERSION}) — deterministic presentation toolkit

Usage: aideck <command> [options]

${coreHelp}

${linkHelp}

${skillsHelp}

${presentationHelp}

${templateHelp}

${catalogHelp}

${generationHelp}

${outputHelp}`;

export function main(argv = process.argv.slice(2)): void {
  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "help") {
    console.log(help);
    return;
  }
  if (command === "--version" || command === "version") {
    console.log(VERSION);
    return;
  }
  if (command === "init" || command === "upgrade" || command === "doctor" || command === "config" || command === "list") return runCore([command, ...args]);
  if (command === "link" || command === "unlink") return runLink([command, ...args]);
  if (command === "skills") return runSkills(args);
  if (command === "new" || command === "slide" || command === "anim" || command === "transition" || command === "validate") return runPresentation([command, ...args]);
  if (command === "template") return runTemplates(args);
  if (command === "blocks" || command === "motion" || command === "tokens") return runCatalog([command, ...args]);
  if (command === "gen") return runGeneration(args);
  if (command === "serve" || command === "export" || command === "pack" || command === "unpack") return runOutput([command, ...args]);
  throw new Error(`Unknown command: ${command}. Run "aideck --help" for usage.`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
