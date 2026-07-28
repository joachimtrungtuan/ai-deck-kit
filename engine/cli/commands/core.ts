import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readJson, writeJson } from "../lib/fs.ts";
import { findWorkspace } from "../lib/workspace.ts";
import { initCommand } from "./init.ts";
import { upgradeCommand } from "./upgrade.ts";
import type { Workspace, WorkspacePointer } from "../lib/types.ts";

export const coreHelp = `Core commands:
  init [--here|--dir <path>]       Scaffold a workspace pointer and user roots
  upgrade [--to <version>]         Refresh the installed engine from this package
  doctor                           Check workspace, engine, templates, and decks
  config [--set key=value]         Read or update ai-deck-kit.json
  list                             List decks in the resolved workspace`;

export function runCore(args: string[]): void {
  const command = args[0] ?? "help";
  if (args.includes("--help") || command === "help") {
    console.log(coreHelp);
    return;
  }
  if (command === "init") return initCommand(args.slice(1));
  const workspace = findWorkspace();
  if (command === "upgrade") return upgradeCommand(workspace, args.slice(1), () => doctorCommand(findWorkspace()));
  if (command === "doctor") return doctorCommand(workspace);
  if (command === "config") return configCommand(workspace, args.slice(1));
  if (command === "list") return listCommand(workspace);
  throw new Error(`Unknown core command: ${command}`);
}

function doctorCommand(workspace: Workspace): void {
  const errors: string[] = [];
  if (!existsSync(workspace.engineRoot)) errors.push(`Engine root missing: ${workspace.engineRoot}`);
  if (!existsSync(workspace.decksRoot)) errors.push(`Decks root missing: ${workspace.decksRoot}`);
  const versionPath = join(workspace.engineRoot, "engine.version.json");
  let version: { engineVersion?: string; contentSchemaVersion?: string; supportedSlideTypeCatalogs?: string[] } = {};
  if (!existsSync(versionPath)) errors.push(`Engine version file missing: ${versionPath}`);
  else {
    version = readJson<typeof version>(versionPath);
    if (version.engineVersion !== workspace.pointer.engineVersion) errors.push(`Version mismatch: pointer=${workspace.pointer.engineVersion}, engine=${version.engineVersion}`);
  }
  const decks = existsSync(workspace.decksRoot) ? readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")) : [];
  for (const entry of decks) {
    const manifestPath = join(workspace.decksRoot, entry, "deck.json");
    try {
      const manifest = readJson<{ slug: string; template?: { set?: string; version?: string }; contentSchemaVersion?: string; slideTypeCatalog?: string }>(manifestPath);
      if (!manifest.slug || !manifest.template?.set || !manifest.template.version) errors.push(`${entry}: incomplete deck manifest.`);
      if (!existsSync(join(workspace.decksRoot, entry, "content.md"))) errors.push(`${entry}: content.md missing.`);
      if (version.contentSchemaVersion && manifest.contentSchemaVersion !== version.contentSchemaVersion) errors.push(`${entry}: unsupported content schema ${manifest.contentSchemaVersion ?? "missing"}.`);
      if (version.supportedSlideTypeCatalogs && manifest.slideTypeCatalog && !version.supportedSlideTypeCatalogs.includes(manifest.slideTypeCatalog)) errors.push(`${entry}: unsupported slide-type catalog ${manifest.slideTypeCatalog}.`);
      if (manifest.template?.set) {
        const templatePath = join(workspace.engineRoot, "templates", `${manifest.template.set}.template`, "template-manifest.json");
        if (!existsSync(templatePath)) errors.push(`${entry}: missing template ${manifest.template.set}@${manifest.template.version}.`);
        else {
          const template = readJson<{ templateVersion?: string }>(templatePath);
          if (template.templateVersion !== manifest.template.version) errors.push(`${entry}: template version mismatch, deck=${manifest.template.version}, installed=${template.templateVersion ?? "missing"}.`);
        }
      }
    } catch (error) {
      errors.push(`${entry}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (errors.length) {
    console.error("Doctor found problems:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Doctor passed: ${decks.length} deck${decks.length === 1 ? "" : "s"} checked.`);
}

function configCommand(workspace: Workspace, args: string[]): void {
  const set = option(args, "--set");
  if (!set) {
    console.log(JSON.stringify(workspace.pointer, null, 2));
    return;
  }
  const separator = set.indexOf("=");
  if (separator < 1) throw new Error("config --set expects key=value.");
  const key = set.slice(0, separator);
  if (!(key in workspace.pointer)) throw new Error(`Unknown config key: ${key}`);
  const pointer = { ...workspace.pointer, [key]: set.slice(separator + 1) };
  writeJson(workspace.pointerPath, pointer);
  console.log(`Updated ${key}.`);
}

function listCommand(workspace: Workspace): void {
  if (!existsSync(workspace.decksRoot)) {
    console.log("No decks found.");
    return;
  }
  const decks = readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")).sort();
  if (!decks.length) return console.log("No decks found.");
  decks.forEach((entry) => {
    const manifest = readJson<{ slug: string; title: string; status: string; template?: { set: string; version: string }; slides?: unknown[] }>(join(workspace.decksRoot, entry, "deck.json"));
    console.log(`${manifest.slug}\t${manifest.status}\t${manifest.template?.set ?? "?"}@${manifest.template?.version ?? "?"}\t${manifest.slides?.length ?? 0} slides\t${manifest.title}`);
  });
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
