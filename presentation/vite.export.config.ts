import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Standalone single-file deck export.
// Inlines JS + CSS + fonts into one HTML so the deck opens by double-click (file://) with no server.
// Which deck to build is passed via EXPORT_DECK; output dir via EXPORT_OUT_DIR.
const presentationRoot = dirname(fileURLToPath(import.meta.url));
const deckId = process.env.EXPORT_DECK ?? "vivimoon-website";
const outDir = process.env.EXPORT_OUT_DIR
  ? resolve(process.env.EXPORT_OUT_DIR)
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
    // Force every asset (fonts, svg) to inline as base64 so nothing is fetched at runtime.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(presentationRoot, "preview-app", "export.html"),
    },
  },
});
