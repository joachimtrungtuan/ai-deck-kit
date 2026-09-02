#!/usr/bin/env node
// Build a deck into a standalone, self-contained HTML file (JS + CSS + fonts inlined as base64).
// The result opens by double-click over file:// with no server. Layouts, elements, and the
// template's CSS entrance animations are preserved because the same React source, design-system.css,
// and any optional template animation stylesheet are bundled. The deck's assets/ folder (including
// regenerable diagram IR) is copied alongside so the export is re-renderable from itself.
//
// Usage:
//   node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs --deck <deck-path-or-slug> [--out <dir>]
//
//   --deck   Deck bundle path or workspace deck slug (required).
//   --out    Output directory. Defaults to the selected deck's .build/export/.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../../..");
const engineDir = resolve(scriptDir, "../../..");

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const deckInput = getArg("deck");
if (!deckInput) {
  console.error("Error: --deck <deck-path-or-slug> is required.");
  process.exit(1);
}
const deckRoot = deckInput.endsWith(".deck")
  ? resolve(deckInput)
  : resolve(findWorkspaceDecksRoot(), `${deckInput}.deck`);
if (!existsSync(resolve(deckRoot, "deck.json")) || !existsSync(resolve(deckRoot, "content.md"))) {
  console.error(`Error: invalid deck bundle: ${deckRoot}`);
  process.exit(1);
}
const outDir = getArg("out")
  ? resolve(getArg("out"))
  : resolve(deckRoot, ".build", "export");

console.log(`Building standalone HTML export\n  deck: ${deckRoot}\n  out:  ${outDir}`);

const result = spawnSync(
  "node_modules/.bin/vite",
  ["build", "--config", "vite.export.config.ts"],
  {
    cwd: engineDir,
    stdio: "inherit",
    env: { ...process.env, EXPORT_OUT_DIR: outDir, ["AIDECK_DECK" + "_PATH"]: deckRoot },
  },
);

if (result.status !== 0) {
  console.error("\nExport build failed.");
  process.exit(result.status ?? 1);
}

// vite names the output after the input html (export.html). Standalone deliverable should be index.html.
const built = resolve(outDir, "export.html");
const finalFile = resolve(outDir, "index.html");
if (existsSync(built)) {
  renameSync(built, finalFile);
}

// favicon.svg from public/ is copied but the export head doesn't reference it — drop the orphan.
const orphanFavicon = resolve(outDir, "favicon.svg");
if (existsSync(orphanFavicon)) {
  rmSync(orphanFavicon);
}

// The deck's assets payload — including regenerable source artifacts such as
// assets/diagrams/*.json — ships next to the HTML (report decision: deck assets are
// excluded from nothing, so an export can be re-rendered from itself).
const deckAssets = resolve(deckRoot, "assets");
if (existsSync(deckAssets)) {
  cpSync(deckAssets, resolve(outDir, "assets"), { recursive: true });
}

console.log(`\nDone. Standalone deck: ${finalFile}`);
console.log("Open it directly in a browser (double-click) — no server required.");

function findWorkspaceDecksRoot(start = process.cwd()) {
  let directory = resolve(start);
  while (true) {
    const pointerPath = resolve(directory, "ai-deck-kit.json");
    if (existsSync(pointerPath)) {
      const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
      if (typeof pointer.decksRoot !== "string" || !pointer.decksRoot) {
        throw new Error(`${pointerPath}: decksRoot must be a non-empty string.`);
      }
      return resolve(directory, pointer.decksRoot);
    }
    const parent = dirname(directory);
    if (parent === directory) return resolve(projectRoot, "decks");
    directory = parent;
  }
}
