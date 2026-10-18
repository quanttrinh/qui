// @ts-check
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createServer } from "vite";

/**
 * Prerenders the demo's document head with the library's `ThemeScript` (see
 * `src/head.tsx`) and writes it to `.head/head.html`. `vite.config.ts` then
 * injects it into `<head>` so the saved theme applies before first paint.
 *
 * Runs before `vite`/`vite build` (see package.json).
 */
const root = path.resolve(import.meta.dirname, "..");

const server = await createServer({
  configFile: path.join(root, "vite.head.config.ts"),
  root,
  appType: "custom",
  logLevel: "warn",
  server: { middlewareMode: true },
});

try {
  const { renderThemeHead } = await server.ssrLoadModule("/src/head.tsx");
  const outDir = path.join(root, ".head");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "head.html"), renderThemeHead(), "utf8");
  console.log("demo: prerendered theme head");
} finally {
  await server.close();
}
