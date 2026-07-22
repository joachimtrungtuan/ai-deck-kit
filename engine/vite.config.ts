import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { aideckDeckPlugin } from "./preview-app/vite-deck-plugin";

const presentationRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(presentationRoot, "..");

export default defineConfig({
  root: "preview-app",
  plugins: [react(), aideckDeckPlugin()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
