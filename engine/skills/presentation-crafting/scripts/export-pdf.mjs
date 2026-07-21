#!/usr/bin/env node
// Render a standalone deck HTML to a client-ready PDF (one landscape page per slide) using
// system Chrome/Chromium plus ImageMagick.
//
// The PDF is a flattened, Preview-friendly raster document: Chrome renders the deck's ?print view
// at the native 1600x900 slide canvas, then ImageMagick crops those pixels into one page per slide.
// This avoids heavy vector/CSS PDFs that render acceptably in Chrome but can clip or lag in macOS
// Preview.
//
// Run export-standalone-html.mjs first, then point this at the produced index.html.
//
// Usage:
//   node engine/skills/presentation-crafting/scripts/export-pdf.mjs --slug <deck-slug> [--out <path.pdf>]
//   node engine/skills/presentation-crafting/scripts/export-pdf.mjs --html <path/to/index.html> [--out <path.pdf>]
//
//   --html   Path to the standalone export HTML.
//   --slug   Shortcut: uses decks/<slug>.deck/.build/export/index.html.
//   --out    Output PDF path. Defaults to <html-dir>/<slug-or-deck>.pdf.
//   --chrome Path to a Chrome/Chromium binary. Overrides auto-detection / CHROME_PATH env.
//   --imagemagick Path to ImageMagick `magick`. Overrides `which magick`.

import { spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../../..");
const decksDir = resolve(projectRoot, "decks");

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

function findImageMagick() {
  const override = getArg("imagemagick");
  if (override) return override;
  const result = spawnSync("which", ["magick"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.status !== 0) {
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    throw new Error(`${basename(command)} failed${details ? `:\n${details}` : ""}`);
  }
  return result.stdout ?? "";
}

function runToFile(command, args, outFile) {
  const outFd = openSync(outFile, "w");
  try {
    const result = spawnSync(command, args, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", outFd, "pipe"],
    });
    if (result.status !== 0) {
      const details = result.stderr?.trim();
      throw new Error(`${basename(command)} failed${details ? `:\n${details}` : ""}`);
    }
  } finally {
    closeSync(outFd);
  }
}

const slug = getArg("slug");
const htmlPath = getArg("html")
  ? resolve(getArg("html"))
  : slug
    ? resolve(decksDir, `${slug}.deck`, ".build", "export", "index.html")
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
const imageMagick = findImageMagick();
if (!imageMagick) {
  console.error("Error: ImageMagick not found. Install ImageMagick, or pass --imagemagick <path>.");
  process.exit(1);
}

const baseName = slug ?? basename(htmlPath).replace(/\.html?$/i, "");
const outPdf = getArg("out") ? resolve(getArg("out")) : resolve(dirname(htmlPath), `${baseName}.pdf`);
// ?print switches the deck to its stacked, one-slide-per-page layout for capture.
const fileUrl = `${pathToFileURL(htmlPath).href}?print`;

console.log(`Rendering PDF\n  chrome: ${chrome}\n  html:   ${htmlPath}\n  out:    ${outPdf}`);

const chromeBaseArgs = [
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
  "--hide-scrollbars",
  "--log-level=3",
];

const workDir = mkdtempSync(join(tmpdir(), "deck-pdf-pages-"));

try {
  console.log("  counting slides...");
  const domDump = join(workDir, "dom.html");
  runToFile(chrome, [
    ...chromeBaseArgs,
    "--virtual-time-budget=5000",
    "--dump-dom",
    fileUrl,
  ], domDump);
  const renderedDom = readFileSync(domDump, "utf8");
  const slideCount = (renderedDom.match(/class="deck-page"/g) ?? []).length;
  if (slideCount < 1) {
    throw new Error("Could not find any .deck-page nodes in the rendered print deck.");
  }

  console.log(`  capturing ${slideCount} slides...`);
  const tallPng = join(workDir, "deck.png");
  const slidePattern = join(workDir, "slide-%02d.jpg");
  run(chrome, [
    ...chromeBaseArgs,
    `--window-size=1600,${slideCount * 900}`,
    "--virtual-time-budget=5000",
    `--screenshot=${tallPng}`,
    fileUrl,
  ]);

  console.log("  assembling PDF...");
  run(imageMagick, [tallPng, "-crop", "1600x900", "+repage", "-quality", "88", slidePattern]);
  const slideFiles = Array.from({ length: slideCount }, (_, index) =>
    join(workDir, `slide-${String(index).padStart(2, "0")}.jpg`),
  );
  const missingSlide = slideFiles.find((file) => !existsSync(file));
  if (missingSlide) {
    throw new Error(`Expected cropped slide image was not created: ${missingSlide}`);
  }

  run(imageMagick, [
    ...slideFiles,
    "-quality",
    "88",
    "-density",
    "144",
    "-units",
    "PixelsPerInch",
    "-page",
    "1600x900",
    outPdf,
  ]);
} catch (error) {
  console.error("\nPDF export failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

console.log(`\nDone. Client-ready PDF: ${outPdf}`);
