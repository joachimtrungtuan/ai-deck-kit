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

function isWithin(root: string, file: string): boolean {
  const path = relative(root, file);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

/** The slide fence's render props: parsed YAML minus the authoring-only keys the renderer never reads. */
function slideRenderProps(section: string): unknown[] {
  const yamlText = section.match(/```ya?ml\n([\s\S]*?)\n```/)?.[1];
  if (!yamlText) return [];
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch {
    return [];
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

/**
 * Builds the shared asset table for a deck: one base64 data URI per distinct file the slides
 * actually render. A file referenced by many slides is stored once and looked up at render time,
 * and files only named in the authoring `assets:` list never reach the export.
 */
export function collectDeckAssetTable(content: string, deckRoot: string, watchedFiles: Set<string>): Record<string, string> {
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
    table[key] = `data:${mime};base64,${readFileSync(filePath).toString("base64")}`;
  }
  return table;
}
