import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { deckPath } from "../lib/deck.ts";
import { listTemplates, resolveTemplate } from "../lib/templates.ts";
import { findWorkspace } from "../lib/workspace.ts";
import type { Workspace } from "../lib/types.ts";

export const outputHelp = `Output commands:
  serve [<deck-id> | deck <id> | template <name> | --deck <id> | --template <name>]
        [--port <port>] [--no-open]
                                      Start the shared Vite preview runtime
  export html <deck-id>               Build standalone HTML through the existing runtime
  export pdf <deck-id>                Build HTML, then the flattened PDF
  pack <deck> [--out <zip>]           Create a portable zip bundle
  unpack <zip> [--out|--to <dir>] [--force]
                                       Restore a .deck bundle`;

export function runOutput(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(outputHelp);
  const workspace = findWorkspace();
  const [command, format, deck] = args;
  if (command === "serve") return runServe(workspace, args);
  if (command === "export" && (format === "html" || format === "pdf")) return runExport(workspace, format, deck);
  if (command === "pack") {
    const { positionals, values } = parseArgsWithOptions(args.slice(1), ["--out"]);
    return runPack(workspace, positionals[0], values.get("--out"));
  }
  if (command === "unpack") {
    const { positionals, values } = parseArgsWithOptions(args.slice(1), ["--out", "--to"]);
    return runUnpack(workspace, positionals[0], values.get("--out") ?? values.get("--to"), args.includes("--force"));
  }
  throw new Error("Unknown output command. Run aideck --help.");
}

/** Splits `--flag value` pairs out from positional arguments, regardless of the order they appear in. */
function parseArgsWithOptions(args: string[], options: string[]): { positionals: string[]; values: Map<string, string> } {
  const positionals: string[] = [];
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (options.includes(token)) {
      const value = args[index + 1];
      if (!value) throw new Error(`${token} requires a value.`);
      values.set(token, value);
      index += 1;
      continue;
    }
    if (token === "--force") continue;
    positionals.push(token);
  }
  return { positionals, values };
}

function runServe(workspace: ReturnType<typeof findWorkspace>, args: string[]): void {
  const vite = join(workspace.engineRoot, "node" + "_modules", ".bin", "vite");
  if (!existsSync(vite)) throw new Error(`Vite executable missing: ${vite}`);
  const options = parseServeArgs(args);
  const viteArgs = buildServeViteArgs(options);
  const deckRoot = options.deck ? resolveDeckForServe(workspace, options.deck) : "";
  const template = options.template ? resolveTemplate(workspace, options.template) : undefined;
  const templateRoot = template?.root ?? "";
  // Say out loud what is about to be rendered, so a wrong target is caught before the browser opens.
  if (deckRoot) console.log(`Serving deck ${basename(deckRoot)}: ${deckRoot}`);
  if (template) console.log(`Serving template ${template.manifest.name} (${template.origin} ${template.manifest.templateVersion}): ${template.root}`);
  if (!deckRoot && !templateRoot) console.log("Serving the template gallery (no deck or template selected).");
  const deckPathKey = "AIDECK_DECK" + "_PATH";
  const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
  const engineRootKey = "AIDECK_ENGINE" + "_ROOT";
  const galleryKey = "AIDECK_TEMPLATE" + "_GALLERY";
  const result = spawnSync(vite, viteArgs, {
    cwd: workspace.engineRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      [deckPathKey]: deckRoot,
      [templatePathKey]: templateRoot,
      [engineRootKey]: workspace.engineRoot,
      // The gallery renders exactly what this project can resolve — never a hardcoded shipped set.
      [galleryKey]: JSON.stringify(galleryEntries(workspace)),
    },
  });
  if (result.status !== 0) throw new Error(`Preview server exited with code ${result.status ?? 1}.`);
}

/** Templates the preview may show, resolved through the same precedence every other command uses. */
function galleryEntries(workspace: Workspace): { name: string; root: string; origin: string }[] {
  return listTemplates(workspace).flatMap((entry) => {
    try {
      resolveTemplate(workspace, entry.name);
    } catch {
      return []; // A broken bundle is reported by `template validate`; it must not break the gallery.
    }
    return [{ name: entry.name, root: entry.root, origin: entry.origin }];
  });
}

function resolveDeckForServe(workspace: Workspace, deck: string): string {
  const root = deckPath(workspace, deck);
  if (existsSync(join(root, "deck.json"))) return root;
  const templateMatch = listTemplates(workspace).find((entry) => entry.name === deck);
  if (templateMatch) throw new Error(`"${deck}" is a template, not a deck. Run: aideck serve template ${deck}`);
  const available = existsSync(workspace.decksRoot)
    ? readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")).map((entry) => entry.slice(0, -".deck".length))
    : [];
  const hint = available.length ? ` Available decks: ${available.join(", ")}.` : " This project has no decks yet.";
  throw new Error(`Deck not found: ${root}.${hint}`);
}

export type ServeOptions = {
  deck?: string;
  open: boolean;
  port?: string;
  template?: string;
};

export function parseServeArgs(args: string[]): ServeOptions {
  const tokens = args[0] === "serve" ? args.slice(1) : args;
  const positionals: string[] = [];
  let deck: string | undefined;
  let template: string | undefined;
  let port: string | undefined;
  let open = true;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--no-open") {
      open = false;
      continue;
    }
    if (token === "--deck" || token === "--template" || token === "--port") {
      const value = tokens[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${token} requires a value.`);
      if (token === "--deck") {
        if (deck) throw new Error("--deck can only be provided once.");
        deck = value;
      }
      if (token === "--template") {
        if (template) throw new Error("--template can only be provided once.");
        template = value;
      }
      if (token === "--port") port = value;
      index += 1;
      continue;
    }
    if (token.startsWith("--")) throw new Error(`Unknown serve option: ${token}`);
    positionals.push(token);
  }

  if (positionals.length > 0 && (deck || template)) {
    throw new Error("Choose one serve target. Choose either --deck or --template, not both.");
  }
  if (positionals.length === 1) {
    if (positionals[0] === "deck" || positionals[0] === "template") {
      throw new Error(`${positionals[0]} requires a value.`);
    }
    deck = positionals[0];
  } else if (positionals.length === 2 && (positionals[0] === "deck" || positionals[0] === "template")) {
    if (positionals[0] === "deck") deck = positionals[1];
    else template = positionals[1];
  } else if (positionals.length > 0) {
    throw new Error(`Unknown serve arguments: ${positionals.join(" ")}`);
  }
  if (deck && template) throw new Error("Choose either --deck or --template, not both.");

  return {
    ...(deck ? { deck } : {}),
    open,
    ...(port ? { port } : {}),
    ...(template ? { template } : {}),
  };
}

export function buildServeViteArgs(options: ServeOptions): string[] {
  const args = ["--host", "127.0.0.1"];
  if (options.port) args.push("--port", options.port);
  if (options.open) args.push("--open");
  return args;
}

function runExport(workspace: ReturnType<typeof findWorkspace>, format: string, deck: string | undefined): void {
  if (!deck) throw new Error(`Usage: aideck export ${format} <deck-id>`);
  const scriptRoot = join(workspace.engineRoot, "skills", "presentation-crafting", "scripts");
  const htmlScript = join(scriptRoot, "export-standalone-html.mjs");
  const root = deckPath(workspace, deck);
  const htmlResult = spawnSync(process.execPath, [htmlScript, "--deck", root], { cwd: workspace.root, stdio: "inherit" });
  if (htmlResult.status !== 0) throw new Error("HTML export failed.");
  if (format === "pdf") {
    const pdfScript = join(scriptRoot, "export-pdf.mjs");
    const pdfResult = spawnSync(process.execPath, [pdfScript, "--html", join(root, ".build", "export", "index.html"), "--out", join(root, ".build", "export", `${deck}.pdf`)], { cwd: workspace.root, stdio: "inherit" });
    if (pdfResult.status !== 0) throw new Error("PDF export failed.");
  }
}

function runPack(workspace: ReturnType<typeof findWorkspace>, deck: string | undefined, output: string | undefined): void {
  if (!deck) throw new Error("Usage: aideck pack <deck> [--out <zip>]");
  const source = deckPath(workspace, deck);
  if (!existsSync(join(source, "deck.json"))) throw new Error(`Deck not found: ${source}`);
  const target = resolve(workspace.root, output ?? `${source}.zip`);
  mkdirSync(join(target, ".."), { recursive: true });
  const bundleName = basename(source);
  const result = spawnSync("zip", ["-qr", target, bundleName, "-x", "*/.build/*", "-x", "*/.DS_Store"], { cwd: join(source, ".."), stdio: "inherit" });
  if (result.status !== 0) throw new Error("Could not create zip bundle.");
  console.log(`Packed deck: ${target}`);
}

function runUnpack(workspace: ReturnType<typeof findWorkspace>, archive: string | undefined, output: string | undefined, force: boolean): void {
  if (!archive) throw new Error("Usage: aideck unpack <zip> [--out|--to <dir>] [--force]");
  const target = resolve(workspace.root, output ?? workspace.decksRoot);
  const archivePath = resolve(workspace.root, archive);
  const entries = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
  if (entries.status !== 0) throw new Error(`Could not inspect zip bundle: ${archivePath}`);
  const entryNames = (entries.stdout ?? "").split("\n").filter(Boolean);
  const unsafeEntry = entryNames.find((entry) => entry.startsWith("/") || entry.split("/").includes(".."));
  if (unsafeEntry) throw new Error(`Refusing unsafe zip entry: ${unsafeEntry}`);
  // zipinfo's verbose listing leads each entry with its permission bits; a symlink's starts with "l".
  // Extracting one could point anywhere on disk once followed, so the archive is rejected outright.
  const listing = spawnSync("unzip", ["-Z", archivePath], { encoding: "utf8" });
  if (listing.status !== 0) throw new Error(`Could not inspect zip bundle: ${archivePath}`);
  const symlinkEntry = (listing.stdout ?? "").split("\n").find((line) => /^l/.test(line.trim()));
  if (symlinkEntry) throw new Error(`Refusing zip bundle containing a symlink entry: ${symlinkEntry.trim()}`);
  const bundleNames = new Set(entryNames.map((entry) => entry.split("/")[0]).filter(Boolean));
  const collisions = [...bundleNames].filter((name) => existsSync(join(target, name)));
  if (collisions.length && !force) {
    throw new Error(`Refusing to overwrite existing bundle(s) in ${target}: ${collisions.join(", ")}. Re-run with --force to overwrite.`);
  }
  mkdirSync(target, { recursive: true });
  const result = spawnSync("unzip", [force ? "-oq" : "-q", archivePath, "-d", target], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Could not unpack zip bundle.");
  console.log(`Unpacked bundle: ${target}`);
}
