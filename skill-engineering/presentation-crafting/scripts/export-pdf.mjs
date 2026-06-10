#!/usr/bin/env node
// Render a standalone deck HTML to a client-ready PDF (one landscape page per slide) using the
// system Chrome/Chromium print engine — no npm dependency.
//
// The PDF is faithful to the HTML: ?print renders every slide with the SAME components and CSS as
// the on-screen view, and during printing Chrome's print page (@page 1600x900) is the viewport, so
// `vw`-based sizing resolves to the same values as the interactive iframe. @media print hides the
// nav controls and freezes entrance animations at their final state.
//
// Run export-standalone-html.mjs first, then point this at the produced index.html.
//
// Usage:
//   node skill-engineering/presentation-crafting/scripts/export-pdf.mjs --slug <deck-slug> [--out <path.pdf>]
//   node skill-engineering/presentation-crafting/scripts/export-pdf.mjs --html <path/to/index.html> [--out <path.pdf>]
//
//   --html   Path to the standalone export HTML.
//   --slug   Shortcut: uses presentation/working-files/<slug>/export/index.html.
//   --out    Output PDF path. Defaults to <html-dir>/<slug-or-deck>.pdf.
//   --chrome Path to a Chrome/Chromium binary. Overrides auto-detection / CHROME_PATH env.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../..");
const presentationDir = resolve(projectRoot, "presentation");

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

function findChrome() {
  const override = getArg("chrome") ?? process.env.CHROME_PATH;
  if (override) return override;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates.find((p) => existsSync(p));
}

const slug = getArg("slug");
const htmlPath = getArg("html")
  ? resolve(getArg("html"))
  : slug
    ? resolve(presentationDir, "working-files", slug, "export", "index.html")
    : undefined;

if (!htmlPath) {
  console.error("Error: provide --html <path> or --slug <deck-slug>.");
  process.exit(1);
}
if (!existsSync(htmlPath)) {
  console.error(`Error: HTML not found: ${htmlPath}\nRun export-standalone-html.mjs first.`);
  process.exit(1);
}

const chrome = findChrome();
if (!chrome) {
  console.error("Error: no Chrome/Chromium found. Install Chrome, or pass --chrome <path> / set CHROME_PATH.");
  process.exit(1);
}

const baseName = slug ?? basename(htmlPath).replace(/\.html?$/i, "");
const outPdf = getArg("out") ? resolve(getArg("out")) : resolve(dirname(htmlPath), `${baseName}.pdf`);
// ?print switches the deck to its stacked, one-slide-per-page layout for capture.
const fileUrl = `${pathToFileURL(htmlPath).href}?print`;

console.log(`Rendering PDF\n  chrome: ${chrome}\n  html:   ${htmlPath}\n  out:    ${outPdf}`);

// Throwaway profile + disabled background features keep this clear of the user's real Chrome session
// and silence the diagnostic stderr noise (allocator / OS-integration / default-app install) that
// otherwise looks like errors. All Chrome output is discarded; only this script's lines are shown.
const userDataDir = mkdtempSync(join(tmpdir(), "deck-pdf-"));
const result = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-default-apps",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-component-update",
    "--disable-features=Translate,MediaRouter,OptimizationHints",
    "--log-level=3",
    `--user-data-dir=${userDataDir}`,
    "--no-pdf-header-footer",
    // Let the page render and fonts settle before capture.
    "--virtual-time-budget=5000",
    `--print-to-pdf=${outPdf}`,
    fileUrl,
  ],
  { stdio: ["ignore", "ignore", "ignore"] },
);
rmSync(userDataDir, { recursive: true, force: true });

if (result.status !== 0 || !existsSync(outPdf)) {
  console.error("\nPDF export failed.");
  process.exit(result.status ?? 1);
}

console.log(`\nDone. Client-ready PDF: ${outPdf}`);
