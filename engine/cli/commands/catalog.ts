import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findWorkspace } from "../lib/workspace.ts";

export const catalogHelp = `Catalog commands:
  blocks list     Print block-catalog v1 entries
  motion list     Print element-animation catalog v1 entries
  tokens print    Print the base token contract`;

export function runCatalog(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(catalogHelp);
  const workspace = findWorkspace();
  const [group, action] = args;
  if (group === "blocks" && action === "list") return printCatalog(workspace, "primitives/blocks/block-catalog-v1.md", /^\| `([^`]+)`/gm);
  if (group === "motion" && action === "list") return printCatalog(workspace, "primitives/motion/element-animation-catalog-v1.md", /^\| `([^`]+)`/gm);
  if (group === "tokens" && action === "print") {
    const file = join(workspace.engineRoot, "primitives", "tokens", "base-token-contract.md");
    if (!existsSync(file)) throw new Error(`Token contract missing: ${file}`);
    console.log(readFileSync(file, "utf8"));
    return;
  }
  throw new Error("Usage: aideck blocks list | motion list | tokens print");
}

function printCatalog(workspace: ReturnType<typeof findWorkspace>, relativeFile: string, pattern: RegExp): void {
  const file = join(workspace.engineRoot, relativeFile);
  if (!existsSync(file)) throw new Error(`Catalog missing: ${file}`);
  const entries = [...readFileSync(file, "utf8").matchAll(pattern)].map((match) => match[1]);
  if (!entries.length) throw new Error(`No catalog entries found: ${file}`);
  console.log(entries.join("\n"));
}
