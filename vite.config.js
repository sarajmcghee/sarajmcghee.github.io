import { defineConfig } from "vite";
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
      output: {
        // Keep three.js out of the entry chunk so the hero text never waits on it.
        manualChunks: (id) => (id.includes("node_modules/three") ? "three" : undefined),
      },
    },
  },
});
