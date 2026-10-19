import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

/**
 * SSR-only config used by `scripts/render-head.mjs` to prerender the document
 * head. The main (client) config lives in `vite.config.ts`.
 */
export default defineConfig({
  plugins: [solid({ ssr: true })],
  ssr: {
    noExternal: ["@quanttrinh/solid-qui"],
  },
});
