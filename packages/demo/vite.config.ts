import { readFileSync } from "node:fs";
import path from "node:path";
import pandacss from "@pandacss/vite";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

const root = path.resolve(import.meta.dirname);
const headFile = path.join(root, ".head/head.html");

/**
 * Injects the prerendered `<ThemeScript>` (see `scripts/render-head.mjs`) into
 * the document `<head>` so the saved theme applies before first paint.
 */
function themeHead(): Plugin {
  return {
    name: "demo:theme-head",
    transformIndexHtml(html) {
      try {
        return html.replace("<head>", `<head>${readFileSync(headFile, "utf8")}`);
      } catch {
        return html;
      }
    },
  };
}

export default defineConfig({
  plugins: [themeHead(), pandacss({ transform: true }), solid()],
  resolve: {
    dedupe: ["solid-js"],
  },
  optimizeDeps: {
    exclude: [
      "@quanttrinh/solid-qui",
      "@tanstack/solid-virtual",
      "@zag-js/accordion",
      "@zag-js/checkbox",
      "@zag-js/combobox",
      "@zag-js/radio-group",
      "@zag-js/select",
      "@zag-js/solid",
      "@zag-js/switch",
    ],
  },
  server: {
    port: 3100,
    host: true,
    fs: {
      allow: [path.resolve(import.meta.dirname, "../..")],
    },
  },
});
