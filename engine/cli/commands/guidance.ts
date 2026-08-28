import { relative } from "node:path";
import { inspectSchemaGuidance, syncSchemaGuidance, type GuidanceSelection } from "../lib/schema-guidance.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const guidanceHelp = `Schema guidance commands:
  guidance status [--deck <slug> | --template <name>]    Report guidance state
  guidance sync [--deck <slug> | --template <name>]      Refresh local guidance
  No selector: all project templates and decks.`;

export function runGuidance(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(guidanceHelp);
  const workspace = findWorkspace();
  const action = args[0];
  const selection = parseGuidanceSelection(args.slice(1));
  if (action === "status") return printStatus(workspace.root, inspectSchemaGuidance(workspace, selection));
  if (action !== "sync") throw new Error(`Unknown guidance command: ${action}`);

  const before = inspectSchemaGuidance(workspace, selection);
  const engine = before.find((entry) => entry.level === "engine");
  if (!engine || engine.state !== "current") {
    throw new Error(`Engine schema guidance is missing. Run "aideck upgrade" or "aideck reinstall" first.`);
  }
  const changed = before.filter((entry) => entry.level !== "engine" && entry.state !== "current");
  const after = syncSchemaGuidance(workspace, selection);
  changed.forEach((entry) => console.log(`Synced ${entry.level}: ${relative(workspace.root, entry.path)}`));
  if (!changed.length) console.log("Schema guidance already current.");
  printSummary(after);
}

export function parseGuidanceSelection(args: string[]): GuidanceSelection | undefined {
  if (!args.length) return undefined;
  const [flag, name] = args;
  if (args.length !== 2 || !["--deck", "--template"].includes(flag) || !name || !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:deck|template))?$/.test(name)) {
    throw new Error("Choose exactly one --deck <slug> or --template <name>, or omit selectors for all project bundles.");
  }
  return { level: flag === "--deck" ? "deck" : "template", name };
}

function printStatus(root: string, entries: ReturnType<typeof inspectSchemaGuidance>): void {
  entries.forEach((entry) => console.log(`${entry.level}\t${entry.state}\t${relative(root, entry.path)}`));
  printSummary(entries);
}

function printSummary(entries: ReturnType<typeof inspectSchemaGuidance>): void {
  const counts = { current: 0, missing: 0, stale: 0 };
  entries.forEach((entry) => { counts[entry.state] += 1; });
  console.log(`Guidance: ${counts.current} current, ${counts.missing} missing, ${counts.stale} stale.`);
}
