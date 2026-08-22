import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// User site (sarajmcghee.github.io) serves from the domain root, so base is "/".
// A project-page repo would need base: "/<repo-name>/".
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    rollupOptions: {
      // Multi-page build: each case study is a real URL with its own HTML file,
      // so GitHub Pages serves deep links directly instead of needing an SPA
      // 404 fallback, and each page ships only the JS it needs.
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        legacyBroker: resolve(import.meta.dirname, "work/legacy-automation-broker/index.html"),
        leakageAudit: resolve(import.meta.dirname, "work/birdsong-leakage-audit/index.html"),
      },
      output: {
        // Keep three.js out of the entry chunk so the hero text never waits on it.
        manualChunks: (id) => (id.includes("node_modules/three") ? "three" : undefined),
      },
    },
  },
});
