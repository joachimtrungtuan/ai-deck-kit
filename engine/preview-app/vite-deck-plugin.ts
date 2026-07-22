import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

const virtualId = "virtual:aideck-deck";
const resolvedVirtualId = `\0${virtualId}`;
const deckPathKey = "AIDECK_DECK" + "_PATH";

export function aideckDeckPlugin(deckPath = process.env[deckPathKey]): Plugin {
  return {
    name: "aideck-deck-manifest",
    resolveId(id) {
      return id === virtualId ? resolvedVirtualId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualId || !deckPath) return id === resolvedVirtualId ? "export const runtimeDeck = null;" : undefined;
      const root = resolve(deckPath);
      const manifestPath = join(root, "deck.json");
      const contentPath = join(root, "content.md");
      if (!existsSync(manifestPath) || !existsSync(contentPath)) throw new Error(`Deck must contain deck.json and content.md: ${root}`);
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const source = generatedSource(root, manifest.slug);
      const sourceExport = source && readFileSync(source, "utf8").match(/export const (\w+Slides)\s*:/)?.[1];
      if (source && sourceExport) return `import { ${sourceExport} } from ${JSON.stringify(source)};\nexport const runtimeDeck = { id: ${JSON.stringify(manifest.slug)}, label: ${JSON.stringify(manifest.title)}, deckClass: ${JSON.stringify(manifest.template?.set === "linear-dark" ? "ld-deck" : "swiss-deck")}, slides: ${sourceExport} };`;
      return `import { createManifestDeckSource } from ${JSON.stringify(join(process.cwd(), "preview-app/src/manifest-deck-source.tsx"))};\nexport const runtimeDeck = createManifestDeckSource(${JSON.stringify(manifest)}, ${JSON.stringify(readFileSync(contentPath, "utf8"))});`;
    },
  };
}

function generatedSource(root: string, slug: string): string | undefined {
  const sourceRoot = join(root, ".build", "source");
  if (!existsSync(sourceRoot)) return undefined;
  return readdirSync(sourceRoot).map((file) => join(sourceRoot, file)).find((file) => file.endsWith(".tsx") && file.includes(slug));
}
