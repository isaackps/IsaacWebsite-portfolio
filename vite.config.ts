import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// file:// support: Chrome refuses module scripts from file:// URLs, so after the build
// scripts/file-protocol.mjs turns the single inlined module into a classic script at the end of <body>.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: "es2019",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
