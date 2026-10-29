import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { aideckDeckPlugin } from "./preview-app/vite-deck-plugin";

// Standalone single-file deck export.
// Inlines JS + CSS + fonts into one HTML so the deck opens by double-click (file://) with no server.
// Which deck to build is passed via EXPORT_DECK; output dir via EXPORT_OUT_DIR.
const presentationRoot = dirname(fileURLToPath(import.meta.url));
const deckPathKey = "AIDECK_DECK" + "_PATH";
const deckId = process.env.EXPORT_DECK ?? (process.env[deckPathKey] ? basename(process.env[deckPathKey]!).replace(/\.deck$/, "") : null);
if (!deckId) {
  // No silent default: the retired sample deck made one impossible. Every real
  // caller (aideck export, the crafting export script) sets AIDECK_DECK_PATH.
  throw new Error("Set EXPORT_DECK or AIDECK_DECK_PATH to name the deck to export.");
}
const outDir = process.env.EXPORT_OUT_DIR
  ? resolve(process.env.EXPORT_OUT_DIR)
  : resolve(presentationRoot, "..", "decks", `${deckId}.deck`, ".build", "export");

export default defineConfig({
  root: "preview-app",
  base: "./",
  define: {
    __EXPORT_DECK_ID__: JSON.stringify(deckId),
  },
  plugins: [react(), aideckDeckPlugin(undefined, undefined, undefined, undefined, { stripNotes: true }), viteSingleFile()],
  build: {
    outDir,
    emptyOutDir: true,
    // Force every asset (fonts, svg) to inline as base64 so nothing is fetched at runtime.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(presentationRoot, "preview-app", "export.html"),
    },
  },
});
