import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const presentationRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "preview-app",
  plugins: [react()],
  server: {
    fs: {
      allow: [presentationRoot],
    },
  },
});
