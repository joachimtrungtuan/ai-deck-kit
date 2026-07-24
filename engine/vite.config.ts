import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { aideckDeckPlugin } from "./preview-app/vite-deck-plugin";

const presentationRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = findWorkspaceRoot(presentationRoot) ?? resolve(presentationRoot, "..");

export default defineConfig({
  root: "preview-app",
  plugins: [react(), aideckDeckPlugin()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});

function findWorkspaceRoot(start: string): string | undefined {
  let directory = resolve(start);
  while (true) {
    if (existsSync(resolve(directory, "ai-deck-kit.json"))) return directory;
    const parent = resolve(directory, "..");
    if (parent === directory) return undefined;
    directory = parent;
  }
}
