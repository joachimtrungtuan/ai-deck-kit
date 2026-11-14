import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { authoringSlideYamlKeys } from "./src/authoring-slide-yaml-keys.ts";
import { assetKeysInString, visitStrings } from "./src/deck-asset-paths.ts";

const assetMimeTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
};

export function isWithin(root: string, file: string): boolean {
  const path = relative(root, resolve(file));
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

/**
 * Fallback for a fence that is not valid YAML: the lenient legacy parser still renders its
 * `key: value` lines, so scan them the same way. Authoring-only keys (and their indented
 * continuation lines) are skipped; outer quotes on a value are dropped.
 */
function lenientFenceValues(yamlText: string): string[] {
  const values: string[] = [];
  let authoring = false;
  for (const line of yamlText.split("\n")) {
    const top = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) authoring = authoringSlideYamlKeys.includes(top[1]);
    if (authoring) continue;
    const value = (top ? top[2] : line.replace(/^\s*-\s+/, "").replace(/^\s*[\w-]+:\s+/, "")).trim();
    values.push(/^(["']).*\1$/.test(value) ? value.slice(1, -1) : value);
  }
  return values;
}

/** The slide fence's render props: parsed YAML minus the authoring-only keys the renderer never reads. */
function slideRenderProps(section: string): unknown[] {
  const yamlText = section.match(/```ya?ml\n([\s\S]*?)\n```/)?.[1];
  if (!yamlText) return [];
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch {
    return lenientFenceValues(yamlText);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  return Object.entries(parsed as Record<string, unknown>)
    .filter(([key]) => !authoringSlideYamlKeys.includes(key))
    .map(([, value]) => value);
}

/** Every distinct `assets/<file>` key a slide renders, in first-seen order. */
export function referencedAssetKeys(content: string): string[] {
  const keys = new Set<string>();
  for (const section of content.split(/^## Slide\s+\d/m).slice(1)) {
    for (const value of slideRenderProps(section)) visitStrings(value, (text) => assetKeysInString(text).forEach((key) => keys.add(key)));
  }
  return [...keys];
}

/** How the export carries asset bytes: inside the HTML as data URIs, or as files the HTML links to. */
export type AssetDelivery = "embedded" | "linked";

/**
 * Builds the shared asset table for a deck: one entry per distinct file the slides actually render.
 * Embedded delivery maps each key to a base64 data URI, stored once and looked up at render time;
 * linked delivery maps each key to its own relative path, so the page points at a file beside it.
 * Files only named in the authoring `assets:` list never reach the export.
 */
export function collectDeckAssetTable(
  content: string,
  deckRoot: string,
  watchedFiles: Set<string>,
  delivery: AssetDelivery = "embedded",
): Record<string, string> {
  const assetsRoot = resolve(deckRoot, "assets");
  const table: Record<string, string> = {};
  for (const key of referencedAssetKeys(content)) {
    const relPath = key.slice("assets/".length);
    const filePath = resolve(assetsRoot, relPath);
    if (!isWithin(assetsRoot, filePath)) throw new Error(`Asset path escapes deck assets/: ${relPath}`);
    if (!existsSync(filePath)) throw new Error(`Referenced asset not found: assets/${relPath} (deck: ${deckRoot})`);
    // A symlink inside assets/ must not carry a file from outside the deck into the export.
    if (!isWithin(realpathSync(assetsRoot), realpathSync(filePath))) throw new Error(`Asset path escapes deck assets/: ${relPath}`);
    watchedFiles.add(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const mime = assetMimeTypes[ext];
    if (!mime) throw new Error(`Unsupported asset type ".${ext}" for assets/${relPath}`);
    table[key] = delivery === "linked" ? key : `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
  }
  return table;
}
