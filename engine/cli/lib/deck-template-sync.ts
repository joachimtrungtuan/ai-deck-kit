// Compares each deck's frozen template snapshot against the template it came from, and re-syncs it.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { copyTree, readJson, removeTree, writeJson } from "./fs.ts";
import { findTemplate, type ResolvedTemplate } from "./templates.ts";
import type { DeckManifest, Workspace } from "./types.ts";

export type DriftState = "current" | "behind" | "ahead" | "source-switched" | "source-missing" | "unknown-origin";

export type DeckDrift = {
  slug: string;
  bundle: string;
  templateName: string;
  deckVersion: string;
  sourceVersion?: string;
  sourceOrigin?: ResolvedTemplate["origin"];
  state: DriftState;
  detail: string;
};

export function deckBundles(workspace: Workspace): string[] {
  if (!existsSync(workspace.decksRoot)) return [];
  return readdirSync(workspace.decksRoot).filter((entry) => entry.endsWith(".deck")).sort();
}

/** Read-only comparison. Never throws for a deck it cannot classify — it reports the problem instead. */
export function deckDrift(workspace: Workspace, bundle: string): DeckDrift {
  const manifest = readJson<DeckManifest>(join(workspace.decksRoot, bundle, "deck.json"));
  const templateName = manifest.template?.set ?? "";
  const deckVersion = manifest.template?.version ?? "";
  const base = { slug: manifest.slug ?? bundle, bundle, templateName, deckVersion };
  const source = templateName ? findTemplate(workspace, templateName) : undefined;
  if (!source) return { ...base, state: "source-missing", detail: `source template "${templateName}" no longer exists` };

  const sourceVersion = source.manifest.templateVersion;
  const found = { ...base, sourceVersion, sourceOrigin: source.origin };
  if (!manifest.template.origin) {
    return { ...found, state: "unknown-origin", detail: `created before origin was recorded; now resolves to the ${source.origin} template at ${sourceVersion}` };
  }
  if (manifest.template.origin !== source.origin) {
    return { ...found, state: "source-switched", detail: `source changed ${manifest.template.origin} → ${source.origin}` };
  }
  const comparison = compareVersions(deckVersion, sourceVersion);
  if (comparison < 0) return { ...found, state: "behind", detail: `${deckVersion} → ${sourceVersion}` };
  if (comparison > 0) return { ...found, state: "ahead", detail: `deck ${deckVersion} is newer than source ${sourceVersion}` };
  return { ...found, state: "current", detail: sourceVersion };
}

export function describeDrift(drift: DeckDrift): string {
  return drift.state === "current" ? `current (${drift.detail})` : `${drift.state} (${drift.detail})`;
}

export type RetemplateResult = {
  deckRoot: string;
  templateName: string;
  from: string;
  to: string;
  origin: ResolvedTemplate["origin"];
  majorChange: boolean;
};

/**
 * Replace a deck's frozen template snapshot with the current source bundle. Refuses when the target
 * cannot render a slide type the deck already uses — the only structural guarantee the CLI can make.
 * Everything below that (layout fit, renamed tokens, overflow) is the agent's to verify afterwards.
 */
export function retemplateDeck(deckRoot: string, template: ResolvedTemplate): RetemplateResult {
  const manifestPath = join(deckRoot, "deck.json");
  const manifest = readJson<DeckManifest>(manifestPath);
  const supported = new Set(template.manifest.supportedSlideTypes ?? []);
  const unsupported = (manifest.slides ?? []).filter((slide) => !supported.has(slide.type));
  if (unsupported.length) {
    throw new Error(
      [
        `Template "${template.manifest.name}" does not support every slide type this deck uses:`,
        ...unsupported.map((slide) => `- ${slide.id} (${slide.type})`),
        `Change those slides first, or choose a template that declares these types.`,
      ].join("\n"),
    );
  }

  const from = manifest.template.version;
  const to = template.manifest.templateVersion;
  const snapshot = join(deckRoot, "template");
  const backup = `${snapshot}.backup-${process.pid}`;
  removeTree(backup);
  if (existsSync(snapshot)) copyTree(snapshot, backup);
  try {
    removeTree(snapshot);
    copyTree(template.root, snapshot);
  } catch (error) {
    if (existsSync(backup)) {
      removeTree(snapshot);
      copyTree(backup, snapshot);
    }
    throw error;
  }
  removeTree(backup);

  manifest.template = { set: template.manifest.name, version: to, origin: template.origin };
  manifest.slideTypeCatalog = template.manifest.slideTypeCatalog;
  manifest.blockCatalog = template.manifest.blockCatalog ?? manifest.blockCatalog;
  writeJson(manifestPath, manifest);
  return { deckRoot, templateName: template.manifest.name, from, to, origin: template.origin, majorChange: majorPart(from) !== majorPart(to) };
}

function majorPart(version: string): string {
  return version.split(".")[0] ?? "";
}

function compareVersions(left: string, right: string): number {
  const toParts = (value: string) => value.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const a = toParts(left);
  const b = toParts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return 0;
}
