import { ThemeScript } from "@quanttrinh/solid-qui";
import { NoHydration, renderToString } from "solid-js/web";

import { THEME_STORAGE_KEY } from "./theme";

/**
 * The app's own pre-paint code. Keep the key and shape in sync with the
 * provider's `read`/`write` in src/index.tsx.
 */
const prePaint = `(function () {
  try {
    var stored = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "null");
    var dark =
      stored && typeof stored.dark === "boolean"
        ? stored.dark
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var root = document.documentElement;
    root.classList.toggle("dark", !!dark);
    root.style.colorScheme = dark ? "dark" : "light";
    if (stored && typeof stored.variables === "object" && stored.variables) {
      for (var key in stored.variables) {
        root.style.setProperty(key, stored.variables[key]);
      }
    }
  } catch (error) {
    /* storage unavailable */
  }
})();`;

/**
 * Prerenders the document head via `ThemeScript`. Run at build time by
 * `scripts/render-head.mjs`; `vite.config.ts` injects the result into `<head>`.
 */
export function renderThemeHead(): string {
  // `NoHydration` keeps Solid from adding hydration markers (`data-hk`); this
  // script is standalone, not part of the app's hydration tree.
  return renderToString(() => (
    <NoHydration>
      <ThemeScript>{prePaint}</ThemeScript>
    </NoHydration>
  ));
}
