import fs from "node:fs";
import path from "node:path";

const URL_RE = /(?:url\(\s*|@import\s+)(["']?)(https?:\/\/[^\s)'" ]+)\1/gi;
const NON_HTTP_URL_RE = /url\(\s*["']?((?:[a-z][a-z0-9+.-]*:|\/\/)[^\s)'" ]+)["']?\s*\)/gi;
const ATTR_RE = /\b(?:src|href)\s*=\s*(["'])(https?:\/\/[^"']+)\1/gi;

/** Scan only the deck, resolved template and manifest; returns exact-origin CSP allowances. */
export function scanExternalSources({ deckRoot, templateRoot, templateManifestPath, layoutRoots = [] } = {}) {
  const allowances = [];
  const errors = [];
  const seen = new Set();
  const add = (directive, raw, source) => {
    let url;
    try { url = new URL(raw); } catch { errors.push(`Unclassifiable external source "${raw}" in ${source}.`); return; }
    if (!/^https?:$/.test(url.protocol)) return;
    if (url.protocol === "http:") { errors.push(`HTTP external source is not allowed: ${raw} in ${source}.`); return; }
    if (!directive) { errors.push(`Unclassifiable external source "${raw}" in ${source}.`); return; }
    const origin = url.origin;
    if (origin === "null" || origin.includes("*")) { errors.push(`External source has no exact origin: ${raw} in ${source}.`); return; }
    const key = `${directive}|${origin}|${source}`;
    if (!seen.has(key)) { seen.add(key); allowances.push({ directive, origin, source }); }
  };
  const scanFile = (file, kind) => {
    let text; try { text = fs.readFileSync(file, "utf8"); } catch { return; }
    if (kind === "css") {
      for (const match of text.matchAll(URL_RE)) {
        const raw = match[2];
        const before = text.slice(Math.max(0, (match.index ?? 0) - 180), match.index ?? 0);
        const directive = /@font-face[\s\S]*?\{[^}]*$/i.test(before) || /\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(raw) ? "font-src" : "style-src";
        add(directive, raw, file);
      }
      for (const match of text.matchAll(NON_HTTP_URL_RE)) {
        if (/^(?:data:|#|[./]|https?:)/i.test(match[1])) continue;
        errors.push(`Unclassifiable external source "${match[1]}" in ${file}.`);
      }
    }
    for (const match of text.matchAll(ATTR_RE)) {
      const attr = text.slice(Math.max(0, (match.index ?? 0) - 24), match.index ?? 0).match(/(src|href)\s*=\s*$/i)?.[1];
      const before = text.slice(Math.max(0, (match.index ?? 0) - 80), match.index ?? 0);
      const directive = /<script\b/i.test(before) ? "script-src" : attr === "src" ? (/\.(?:mp4|webm|mp3|wav)(?:[?#]|$)/i.test(match[2]) ? "media-src" : "img-src") : "frame-src";
      add(directive, match[2], file);
    }
    for (const match of text.matchAll(/\b(src|href)\s*:\s*["'](https?:\/\/[^"']+)["']/gi)) {
      const directive = match[1].toLowerCase() === "href" ? "frame-src" : (/\.(?:mp4|webm|mp3|wav)(?:[?#]|$)/i.test(match[2]) ? "media-src" : "img-src");
      add(directive, match[2], file);
    }
  };
  const walk = (root) => {
    if (!root || !fs.existsSync(root)) return;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.endsWith(".min.js")) continue;
      const file = path.join(root, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(?:css|md|json|tsx?|jsx?|html|svg)$/i.test(entry.name)) scanFile(file, path.extname(entry.name).toLowerCase() === ".css" ? "css" : "text");
    }
  };
  walk(deckRoot); walk(templateRoot); layoutRoots.forEach(walk);
  if (templateManifestPath && fs.existsSync(templateManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(templateManifestPath, "utf8"));
    for (const family of manifest.fonts ?? []) {
      if (typeof family !== "string") errors.push(`Unclassifiable manifest font source: ${JSON.stringify(family)} in ${templateManifestPath}.`);
    }
  }
  return { allowances, errors };
}

export function allowancesForCsp(scan) {
  const result = { styleSrc: [], fontSrc: [], imgSrc: [], mediaSrc: [], frameSrc: [], scriptSrc: [] };
  for (const item of scan.allowances ?? []) {
    const key = item.directive.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (key in result && !result[key].includes(item.origin)) result[key].push(item.origin);
  }
  return result;
}
