#!/usr/bin/env node
// Export a deck as HTML that opens by double-click over file:// with no server.
// Layouts, elements, and the template's CSS entrance animations are preserved because the same
// React source, design-system.css, and any optional template animation stylesheet are bundled.
//
// Two delivery modes, the same app script in both:
//   single (default)  One self-contained index.html: JS, CSS, fonts and every rendered asset inlined.
//   web               index.html plus an assets/ folder holding only the files the slides reference.
//                     Host the folder on any static server; no server configuration is written.
//
// Usage:
//   node engine/skills/presentation-crafting/scripts/export-standalone-html.mjs --deck <deck-path-or-slug> [--out <dir>] [--mode single|web]
//
//   --deck   Deck bundle path or workspace deck slug (required).
//   --out    Output directory. Defaults to the selected deck's .build/export/.
//   --mode   single (default) or web.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { moveAppScriptIntoBody } from "./export-html-assembly.mjs";
import { appendSlideDataBlocksFromFile } from "./export-html-slide-data-blocks.mjs";
import { addExportSecurityMeta } from "./export-html-csp-meta.mjs";
import { scanExternalSources, allowancesForCsp } from "./export-html-source-scan.mjs";
import { embedGoogleFontsInStyleBlocks } from "./export-google-fonts-embed.mjs";
import { countExportSlides, runHtmlCspHeadlessCheck } from "./export-html-csp-headless-check.mjs";
import { findChrome } from "./find-chrome-executable.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../../..");
const engineDir = resolve(scriptDir, "../../..");

/** Reads `--name value` or `--name=value`; a flag given without a value exits with an error instead of being ignored. */
function getArg(name) {
  const flag = `--${name}`;
  for (let i = 0; i < process.argv.length; i++) {
    const token = process.argv[i];
    if (token.startsWith(`${flag}=`)) return token.slice(flag.length + 1);
    if (token !== flag) continue;
    const value = process.argv[i + 1];
    if (!value || value.startsWith("--")) {
      console.error(`Error: ${flag} requires a value.`);
      process.exit(1);
    }
    return value;
  }
  return undefined;
}

const exportModes = ["single", "web"];
const mode = getArg("mode") ?? "single";
if (!exportModes.includes(mode)) {
  console.error(`Error: --mode must be one of ${exportModes.join(", ")} (got "${mode}").`);
  process.exit(1);
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

console.log(`Exporting ${mode} HTML\n  deck: ${deckRoot}\n  out:  ${outDir}`);
const templateRoot = resolve(deckRoot, "template");
const templateManifestPath = resolve(templateRoot, "template-manifest.json");
const sourceScan = scanExternalSources({ deckRoot, templateRoot, templateManifestPath });
if (sourceScan.errors.length) {
  console.error("External-source scan failed:");
  sourceScan.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
const cspAllowances = allowancesForCsp({ allowances: sourceScan.allowances.filter(({ origin }) => !["https://fonts.googleapis.com", "https://fonts.gstatic.com"].includes(origin)) });
for (const allowance of sourceScan.allowances) console.log(`CSP allowance: ${allowance.directive} ${allowance.origin} (${allowance.source})`);
mkdirSync(outDir, { recursive: true });

const result = spawnSync(
  "node_modules/.bin/vite",
  ["build", "--config", "vite.export.config.ts"],
  {
    cwd: engineDir,
    stdio: "inherit",
    env: { ...process.env, EXPORT_OUT_DIR: outDir, AIDECK_EXPORT_MODE: mode, ["AIDECK_DECK" + "_PATH"]: deckRoot, ["AIDECK" + "_BLOCKS_PATH"]: resolve(outDir, ".asset-manifest.json") },
  },
);

if (result.status !== 0) {
  const failedManifestPath = resolve(outDir, ".asset-manifest.json");
  if (existsSync(failedManifestPath)) rmSync(failedManifestPath);
  console.error("\nExport failed.");
  process.exit(result.status ?? 1);
}

// vite names the output after the input html (export.html). The deliverable is index.html, with the
// app script moved from <head> into <body> as a classic script (see export-html-assembly.mjs).
const built = resolve(outDir, "export.html");
const finalFile = resolve(outDir, "index.html");
const manifestPath = resolve(outDir, ".asset-manifest.json");
try {
  const builtHtml = await embedGoogleFontsInStyleBlocks(readFileSync(built, "utf8"));
  let assembled = moveAppScriptIntoBody(builtHtml);
  if (mode === "single") assembled = appendSlideDataBlocksFromFile(assembled, manifestPath);
  assembled = addExportSecurityMeta(assembled, { mode, allowances: cspAllowances });
  writeFileSync(finalFile, assembled);
  rmSync(built);
} finally {
  if (existsSync(manifestPath)) rmSync(manifestPath);
  if (existsSync(built)) rmSync(built);
}

try {
  const check = runHtmlCspHeadlessCheck({ htmlPath: finalFile, chrome: findChrome({ override: getArg("chrome") }), slideCount: countExportSlides(finalFile) });
  if (!check.skipped) console.log(`CSP check passed (normal + print, ${check.elapsedMs}ms).`);
} catch (error) {
  console.error(`\nExport CSP check failed.\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// favicon.svg from public/ is copied but the export head doesn't reference it — drop the orphan.
const orphanFavicon = resolve(outDir, "favicon.svg");
if (existsSync(orphanFavicon)) {
  rmSync(orphanFavicon);
}

// Single mode is the one HTML file alone: assets are already inside it. Web mode's assets/ folder is
// emitted by the vite step with only the files the slides reference, so nothing is copied here.
if (mode === "single") {
  console.log(`\nDone. Standalone deck: ${finalFile}`);
  console.log("Open it directly in a browser (double-click) — no server required.");
} else {
  console.log(`\nDone. Web deck: ${finalFile} with its assets/ folder.`);
  console.log("Open index.html directly, or host the folder on any static server. Keep the folder together.");
}
console.log("Server headers note: set frame-ancestors, X-Frame-Options, X-Content-Type-Options: nosniff, and HSTS at the web server.");

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
