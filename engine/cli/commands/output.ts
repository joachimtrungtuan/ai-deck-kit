import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { deckPath } from "../lib/deck.ts";
import { getPreviewTemplate } from "../lib/templates.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const outputHelp = `Output commands:
  serve [--deck <id> | --template <name>] [--port <port>] [--no-open]
                                      Start the shared Vite preview runtime
  export html <deck-id>               Build standalone HTML through the existing runtime
  export pdf <deck-id>                Build HTML, then the flattened PDF
  pack <deck> [--out <zip>]           Create a portable zip bundle
  unpack <zip> [--out|--to <dir>]     Restore a .deck bundle`;

export function runOutput(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(outputHelp);
  const workspace = findWorkspace();
  const [command, format, deck] = args;
  if (command === "serve") return runServe(workspace, args);
  if (command === "export" && (format === "html" || format === "pdf")) return runExport(workspace, format, deck);
  if (command === "pack") return runPack(workspace, format, valueAfter(args, "--out"));
  if (command === "unpack") return runUnpack(workspace, format, valueAfter(args, "--out") ?? valueAfter(args, "--to"));
  throw new Error("Unknown output command. Run aideck --help.");
}

function runServe(workspace: ReturnType<typeof findWorkspace>, args: string[]): void {
  const vite = join(workspace.engineRoot, "node" + "_modules", ".bin", "vite");
  if (!existsSync(vite)) throw new Error(`Vite executable missing: ${vite}`);
  const viteArgs = ["--host", "127.0.0.1"];
  const port = optionValueAfter(args, "--port");
  if (port) viteArgs.push("--port", port);
  const selectedDeck = optionValueAfter(args, "--deck");
  const selectedTemplate = optionValueAfter(args, "--template");
  if (selectedDeck && selectedTemplate) throw new Error("Choose either --deck or --template, not both.");
  const deckRoot = selectedDeck ? deckPath(workspace, selectedDeck) : "";
  const templateRoot = selectedTemplate ? getPreviewTemplate(workspace, selectedTemplate).root : "";
  if (!args.includes("--no-open")) viteArgs.push("--open");
  const deckPathKey = "AIDECK_DECK" + "_PATH";
  const templatePathKey = "AIDECK_TEMPLATE" + "_PATH";
  const engineRootKey = "AIDECK_ENGINE" + "_ROOT";
  const result = spawnSync(vite, viteArgs, {
    cwd: workspace.engineRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      [deckPathKey]: deckRoot,
      [templatePathKey]: templateRoot,
      [engineRootKey]: workspace.engineRoot,
    },
  });
  if (result.status !== 0) throw new Error(`Preview server exited with code ${result.status ?? 1}.`);
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
  const bundleName = source.split("/").at(-1)!;
  const result = spawnSync("zip", ["-qr", target, bundleName, "-x", "*/.build/*", "-x", "*/.DS_Store"], { cwd: join(source, ".."), stdio: "inherit" });
  if (result.status !== 0) throw new Error("Could not create zip bundle.");
  console.log(`Packed deck: ${target}`);
}

function runUnpack(workspace: ReturnType<typeof findWorkspace>, archive: string | undefined, output: string | undefined): void {
  if (!archive) throw new Error("Usage: aideck unpack <zip> [--out|--to <dir>]");
  const target = resolve(workspace.root, output ?? workspace.decksRoot);
  const archivePath = resolve(workspace.root, archive);
  const entries = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
  if (entries.status !== 0) throw new Error(`Could not inspect zip bundle: ${archivePath}`);
  const unsafeEntry = (entries.stdout ?? "").split("\n").find((entry) => entry.startsWith("/") || entry.split("/").includes(".."));
  if (unsafeEntry) throw new Error(`Refusing unsafe zip entry: ${unsafeEntry}`);
  mkdirSync(target, { recursive: true });
  const result = spawnSync("unzip", ["-q", archivePath, "-d", target], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Could not unpack zip bundle.");
  console.log(`Unpacked bundle: ${target}`);
}

function valueAfter(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}

function optionValueAfter(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}
