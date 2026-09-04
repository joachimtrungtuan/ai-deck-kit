// The install boundary, expressed for AI agents: a marker-delimited block in the project's own
// AGENTS.md and CLAUDE.md.
//
// The skills carry the same rule, but an agent may never load a skill before it starts editing —
// these two files are read at the start of every session, which is exactly when the boundary needs
// to be known. Marker-delimited so the block can be refreshed on upgrade without touching a word
// the user wrote around it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { writeText } from "./fs.ts";
import { isInteractive, promptChoice } from "./prompt.ts";

const MARKER_START = "<!-- BEGIN AI Deck Kit boundary -->";
const MARKER_END = "<!-- END AI Deck Kit boundary -->";

/** Both are written: agents read one or the other, and the kit treats them as equals. */
const RULES_FILES = ["AGENTS.md", "CLAUDE.md"] as const;

export type AgentRulesResult = "created" | "updated" | "unchanged" | "skipped";

/**
 * Ask before writing into files the user owns, then report what changed.
 * Without a TTY nothing is asked: `init` passes true because installing is the explicit act, while
 * `upgrade` passes false so it only refreshes a block that is already there.
 */
export function offerProjectAgentRules(projectRoot: string, engineDirectory: string, silentCreateMissing: boolean): void {
  let createMissing = silentCreateMissing;
  if (isInteractive()) {
    console.log("");
    const choice = promptChoice(
      "Tell AI agents in this project where presentation work belongs?\n\nThis adds a short, clearly marked section to AGENTS.md and CLAUDE.md: the\ntoolkit folder is off limits, your templates and decks are not. Anything you\nalready wrote in those files is kept exactly as it is.",
      ["Yes — add it (recommended)", "No thanks"],
    );
    if (choice !== 0) return;
    createMissing = true;
  }
  const written = Object.entries(ensureProjectAgentRules(projectRoot, engineDirectory, createMissing)).filter(([, result]) => result === "created" || result === "updated");
  if (!written.length) return;
  console.log("");
  written.forEach(([name, result]) => console.log(`${result === "created" ? "Created" : "Updated"} ${name} with the AI Deck Kit boundary rules.`));
}

/**
 * Write or refresh the boundary block in each rules file.
 * `createMissing` false refreshes only files that already exist — what an upgrade should do, so a
 * project never wakes up owning files it never asked for.
 */
export function ensureProjectAgentRules(projectRoot: string, engineDirectory: string, createMissing: boolean): Record<string, AgentRulesResult> {
  const block = boundaryBlock(engineDirectory);
  const results: Record<string, AgentRulesResult> = {};
  for (const name of RULES_FILES) {
    const path = join(projectRoot, name);
    if (!existsSync(path)) {
      if (!createMissing) {
        results[name] = "skipped";
        continue;
      }
      writeText(path, `# ${name === "CLAUDE.md" ? "Claude Code" : "AI agent"} guidance\n\n${block}\n`);
      results[name] = "created";
      continue;
    }
    const existing = readFileSync(path, "utf8");
    const merged = mergeBlock(existing, block);
    if (merged === existing) {
      results[name] = "unchanged";
      continue;
    }
    writeText(path, merged);
    results[name] = "updated";
  }
  return results;
}

/** Replace the delimited region if present, otherwise append it. Never touches anything else. */
function mergeBlock(existing: string, block: string): string {
  const start = existing.indexOf(MARKER_START);
  const end = existing.indexOf(MARKER_END);
  if (start !== -1 && end > start) return `${existing.slice(0, start)}${block}${existing.slice(end + MARKER_END.length)}`;
  return `${existing.endsWith("\n") ? existing : `${existing}\n`}\n${block}\n`;
}

/**
 * Undo `ensureProjectAgentRules`: drop the delimited region from each rules file that has one,
 * leaving everything the user wrote around it untouched. A file with no block, or no file at all,
 * is left alone. Returns the names of the files actually changed.
 */
export function removeProjectAgentRules(projectRoot: string): string[] {
  const changed: string[] = [];
  for (const name of RULES_FILES) {
    const path = join(projectRoot, name);
    if (!existsSync(path)) continue;
    const existing = readFileSync(path, "utf8");
    const start = existing.indexOf(MARKER_START);
    const end = existing.indexOf(MARKER_END);
    if (start === -1 || end <= start) continue;
    // mergeBlock inserts one blank line before the block when appending; strip that too.
    const before = existing.slice(0, start).replace(/\n+$/, "\n");
    const after = existing.slice(end + MARKER_END.length).replace(/^\n+/, "");
    const stripped = after ? `${before}${before ? "\n" : ""}${after}` : before;
    writeFileSync(path, stripped);
    changed.push(name);
  }
  return changed;
}

function boundaryBlock(engineDirectory: string): string {
  return [
    MARKER_START,
    "## AI Deck Kit — where presentation work belongs",
    "",
    "This project uses AI Deck Kit. Three folders, three owners:",
    "",
    "```text",
    `${engineDirectory}/**                          READ-ONLY. Never write here.`,
    "templates/{name}.template/**       template work goes here, and only here",
    "decks/{slug}.deck/",
    "├── content.md, assets/            agent-owned — deck work happens here",
    "└── deck.json, template/, .build/  CLI-owned — change through `aideck` commands",
    "```",
    "",
    `\`${engineDirectory}/\` is the toolkit itself. It is gitignored, and \`aideck upgrade\` replaces the whole`,
    "folder, so an edit there is invisible to git while it exists and gone without warning",
    "afterwards. Read it freely — catalogs, shipped templates and primitives are reference",
    "material — but never write into it.",
    "",
    "Everything a template needs lives inside its own bundle: layouts, CSS, icon policy, preview",
    "fixtures (`preview-props.json`), and typefaces (the manifest's `fonts` array). If a task still",
    "appears to need an engine change — a font the catalog lacks, a new slide-type catalog, a",
    "runtime capability — **stop, report exactly what is missing, and escalate to the AI Deck Kit",
    "project.** Finish the rest of the task around the gap; do not work around the boundary.",
    "",
    "Run `aideck verify` when you finish an editing pass. It is read-only, and it names what",
    "reading the workspace will not tell you: an edited engine, a template edited inside a deck's",
    "frozen `template/` copy, a layout that no longer parses, a file left loose beside the bundles.",
    MARKER_END,
  ].join("\n");
}
