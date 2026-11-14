// Shared helpers for tests that run a real standalone export on a throwaway copy of the showcase deck.
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const engineRoot = fileURLToPath(new URL("../..", import.meta.url));
const exportScript = join(engineRoot, "skills", "presentation-crafting", "scripts", "export-standalone-html.mjs");

/** The showcase template reaches the engine primitives and dependencies by relative path, so a copy needs both in reach. */
export function workspaceWithDeck(): { work: string; deck: string } {
  const work = mkdtempSync(join(tmpdir(), "aideck-asset-dedup-"));
  symlinkSync(join(engineRoot, "node" + "_modules"), join(work, "node" + "_modules"), "dir");
  symlinkSync(join(engineRoot, "primitives"), join(work, "primitives"), "dir");
  const deck = join(work, "dedup.deck");
  cpSync(join(engineRoot, "examples", "showcase.deck"), deck, { recursive: true });
  return { work, deck };
}

/** Reduces the copied showcase deck to one slide under the given content schema; the fence text is the slide's own YAML. */
export function writeSingleSlideDeck(deck: string, schemaVersion: string, fence: string): void {
  const manifestPath = join(deck, "deck.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.contentSchemaVersion = schemaVersion;
  manifest.slides = [{ id: "slide-01", type: "full-bleed-image", file: "content.md#slide-01", animation: "none", transition: "none" }];
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const heading = schemaVersion.startsWith("1.") ? "## Slide 01: Probe slide" : "## Slide 01 (slide-01)";
  writeFileSync(join(deck, "content.md"), `# Probe\n\n${heading}\n\n\`\`\`yaml\n${fence}\n\`\`\`\n`);
}

/** Runs the real export build and returns the process result plus the output directory. `modeArgs` passes the mode flag exactly as written. */
export function exportDeck(
  work: string,
  deck: string,
  options: { mode?: string; out?: string; modeArgs?: string[] } = {},
): { status: number | null; output: string; outDir: string } {
  const outDir = join(work, options.out ?? "out");
  const modeArgs = options.modeArgs ?? (options.mode === undefined ? [] : ["--mode", options.mode]);
  const result = spawnSync(process.execPath, [exportScript, "--deck", deck, "--out", outDir, ...modeArgs], { encoding: "utf8" });
  return { status: result.status, output: result.stdout + result.stderr, outDir };
}

/** The embedded asset-table entry for `key`, or undefined when the built page does not map it. */
export function tableEntryInHtml(html: string, key: string): string | undefined {
  return html.match(new RegExp(`["']${key.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}["']\\s*:\\s*["'](data:[^"']+)["']`))?.[1];
}
