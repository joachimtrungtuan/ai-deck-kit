import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { findWorkspace } from "../lib/workspace.ts";
import { runExport } from "./output.ts";
import { resolveDeckForServe, spawnPreviewServer } from "./preview-server-spawn.ts";

export const presentHelp = `Presenter command:
  present <deck-id> [--export] [--port <port>] [--no-open]
                                      Open presenter mode (speaker notes, timer, audience window).
                                      --export presents the standalone HTML export, rebuilding it first when stale.`;

export type PresentOptions = { deck: string; export: boolean; open: boolean; port?: string };

export function parsePresentArgs(args: string[]): PresentOptions {
  const tokens = args[0] === "present" ? args.slice(1) : args;
  const positionals: string[] = [];
  let port: string | undefined;
  let open = true;
  let exportMode = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--export") exportMode = true;
    else if (token === "--no-open") open = false;
    else if (token === "--port") {
      const value = tokens[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--port requires a value.");
      port = value;
      index += 1;
    } else if (token.startsWith("--")) throw new Error(`Unknown present option: ${token}`);
    else positionals.push(token);
  }
  if (positionals.length !== 1) throw new Error("Usage: aideck present <deck-id> [--export] [--port <port>] [--no-open]");
  return { deck: positionals[0], export: exportMode, open, ...(port ? { port } : {}) };
}

/** An export is stale when it is missing or any source it was built from changed after it. */
export function isExportStale(exportMtimeMs: number | null, sourceMtimesMs: number[]): boolean {
  return exportMtimeMs === null || sourceMtimesMs.some((mtime) => mtime > exportMtimeMs);
}

export function presentOpenPath(exportMode: boolean): string {
  return exportMode ? "/?present&source=export" : "/?present";
}

function newestMtimeMs(path: string): number {
  if (!existsSync(path)) return 0;
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  return readdirSync(path).reduce((newest, entry) => Math.max(newest, newestMtimeMs(join(path, entry))), stat.mtimeMs);
}

export function runPresent(args: string[]): void {
  if (!args.length || args.includes("--help")) return console.log(presentHelp);
  const options = parsePresentArgs(args);
  const workspace = findWorkspace();
  const deckRoot = resolveDeckForServe(workspace, options.deck);
  if (options.export) {
    const exported = join(deckRoot, ".build", "export", "index.html");
    const sources = ["content.md", "deck.json", "template", "assets"].map((entry) => newestMtimeMs(join(deckRoot, entry)));
    if (isExportStale(existsSync(exported) ? statSync(exported).mtimeMs : null, sources)) {
      console.log("Export is missing or older than the deck; rebuilding it.");
      runExport(workspace, "html", options.deck);
    }
  }
  const viteArgs = ["--host", "127.0.0.1", ...(options.port ? ["--port", options.port] : []), ...(options.open ? ["--open", presentOpenPath(options.export)] : [])];
  console.log(`Presenting deck ${options.deck}${options.export ? " (export)" : ""}. Speaker notes stay in this window only.`);
  spawnPreviewServer(workspace, { deckRoot, templateRoot: "", viteArgs });
}
