import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const presentationRoot = dirname(fileURLToPath(import.meta.url));
const deckEnvName = "EXPORT" + "_DECK";
const outEnvName = "EXPORT" + "_OUT_DIR";
const deckId = process.env[deckEnvName];

if (!deckId) {
  throw new Error(`${deckEnvName} is required for standalone presentation export.`);
}

const outDir = process.env[outEnvName]
  ? resolve(process.env[outEnvName])
  : resolve(presentationRoot, "working-files", deckId, "export");

export default defineConfig({
  root: "preview-app",
  base: "./",
  define: {
    __EXPORT_DECK_ID__: JSON.stringify(deckId),
  },
  plugins: [react(), viteSingleFile()],
  build: {
    outDir,
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(presentationRoot, "preview-app", "export.html"),
    },
  },
});
