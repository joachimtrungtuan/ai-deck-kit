#!/usr/bin/env node
// Build a deck into ONE standalone, self-contained HTML file (JS + CSS + fonts inlined as base64).
// The result opens by double-click over file:// with no server. Layouts, elements, and the
// template's CSS entrance animations are preserved because the same React source, design-system.css,
// and animation-presets.css are bundled.
//
// Usage:
//   node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs --deck <deck-id> [--slug <slug>] [--out <dir>]
//
//   --deck   Registered deck/source id from preview-app/src/deck-registry.tsx (required).
//   --slug   Deck folder name (without .deck suffix). Defaults to --deck.
//   --out    Output directory. Defaults to decks/<slug>.deck/.build/export/.

import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../../..");
const engineDir = resolve(projectRoot, "engine");
const decksDir = resolve(projectRoot, "decks");

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

const deckInput = getArg("deck");
if (!deckInput) {
  console.error("Error: --deck <deck-path-or-slug> is required.");
  process.exit(1);
}
const deckRoot = deckInput.endsWith(".deck") ? resolve(deckInput) : resolve(projectRoot, "decks", `${deckInput}.deck`);
if (!existsSync(resolve(deckRoot, "deck.json")) || !existsSync(resolve(deckRoot, "content.md"))) {
  console.error(`Error: invalid deck bundle: ${deckRoot}`);
  process.exit(1);
}
const slug = getArg("slug") ?? deckRoot.split("/").at(-1).replace(/\.deck$/, "");
const outDir = getArg("out")
  ? resolve(getArg("out"))
  : resolve(decksDir, `${slug}.deck`, ".build", "export");

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

// favicon.svg from public/ is copied but the export head doesn't reference it — drop the orphan
// so the output folder holds exactly one self-contained file.
const orphanFavicon = resolve(outDir, "favicon.svg");
if (existsSync(orphanFavicon)) {
  rmSync(orphanFavicon);
}

console.log(`\nDone. Standalone deck: ${finalFile}`);
console.log("Open it directly in a browser (double-click) — no server required.");
