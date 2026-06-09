import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const libraryRoot = path.resolve(import.meta.dirname, "../..");
const librarySrc = path.resolve(libraryRoot, "packages/solid-md3/src");

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: [libraryRoot],
    },
  },
  resolve: {
    alias: {
      "@quanttrinh/solid-md3": librarySrc,
    },
    dedupe: ["solid-js"],
  },
  optimizeDeps: {
    exclude: ["@quanttrinh/solid-md3"],
  },
  ssr: {
    noExternal: ["@quanttrinh/solid-md3"],
  },
});
