// Locating the engine root from inside the CLI.
//
// The CLI runs from compiled output (cli/dist/**) but is authored as source
// (cli/**), so any path written relative to a module's own depth is correct in
// one layout and silently wrong in the other. Walking up to the directory that
// holds engine.version.json is true in both.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = "engine.version.json";

export function engineRoot(): string {
  let directory = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(join(directory, MARKER))) return directory;
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`Could not locate the engine root: no ${MARKER} above ${fileURLToPath(import.meta.url)}`);
    directory = parent;
  }
}
