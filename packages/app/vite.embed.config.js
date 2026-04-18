import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    "global": "globalThis",
  },
  build: {
    outDir: "dist-embed",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/embed.jsx"),
      name: "CellExplorerEmbed",
      formats: ["iife"],
      fileName: () => "embed.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  plugins: [react()],
});
