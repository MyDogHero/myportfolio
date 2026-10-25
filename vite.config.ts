import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Relative paths, so the built site works from any folder or web address.
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
  build: {
    outDir: path.resolve(root, "dist/app"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
