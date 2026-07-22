import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { deckPath } from "../lib/deck.ts";
import { findWorkspace } from "../lib/workspace.ts";

export const outputHelp = `Output commands:
  serve [--deck <id>]                 Start the shared Vite preview runtime
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
  const port = valueAfter(args, "--port");
  if (port) viteArgs.push("--port", port);
  const result = spawnSync(vite, viteArgs, { cwd: workspace.engineRoot, stdio: "inherit", env: { ...process.env, AIDECK_DECK: valueAfter(args, "--deck") ?? "" } });
  if (result.status !== 0) throw new Error(`Preview server exited with code ${result.status ?? 1}.`);
}

function runExport(workspace: ReturnType<typeof findWorkspace>, format: string, deck: string | undefined): void {
  if (!deck) throw new Error(`Usage: aideck export ${format} <deck-id>`);
  const scriptRoot = join(workspace.engineRoot, "skills", "presentation-crafting", "scripts");
  const htmlScript = join(scriptRoot, "export-standalone-html.mjs");
  const htmlResult = spawnSync(process.execPath, [htmlScript, "--deck", deck, "--slug", deck], { cwd: workspace.root, stdio: "inherit" });
  if (htmlResult.status !== 0) throw new Error("HTML export failed.");
  if (format === "pdf") {
    const pdfScript = join(scriptRoot, "export-pdf.mjs");
    const pdfResult = spawnSync(process.execPath, [pdfScript, "--slug", deck], { cwd: workspace.root, stdio: "inherit" });
    if (pdfResult.status !== 0) throw new Error("PDF export failed.");
  }
}

function runPack(workspace: ReturnType<typeof findWorkspace>, deck: string | undefined, output: string | undefined): void {
  if (!deck) throw new Error("Usage: aideck pack <deck> [--out <zip>]");
  const source = deckPath(workspace, deck);
  if (!existsSync(join(source, "deck.json"))) throw new Error(`Deck not found: ${source}`);
  const target = resolve(workspace.root, output ?? `${source}.zip`);
  mkdirSync(join(target, ".."), { recursive: true });
  const result = spawnSync("zip", ["-qr", target, ".", "-x", ".build/*"], { cwd: source, stdio: "inherit" });
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
