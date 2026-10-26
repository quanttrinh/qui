/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildModules } from "./lib/compile";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const COMPONENT_TYPE_REFERENCE = '/// <reference path="./components.d.ts" />\n';

/**
 * Ensures the package type entry includes Stencil's global element declarations
 * under every TypeScript module-resolution mode.
 */
function referenceComponentTypes(): void {
  const entry = join(root, "dist", "types", "index.d.ts");
  if (!existsSync(entry)) {
    return;
  }
  const source = readFileSync(entry, "utf8");
  if (!source.startsWith(COMPONENT_TYPE_REFERENCE)) {
    writeFileSync(entry, `${COMPONENT_TYPE_REFERENCE}${source}`);
  }
}

const count = buildModules({
  root,
  source: "src/utilities",
  output: "dist/utilities",
  clean: ["dist/register.js", "dist/register.d.ts"],
});

referenceComponentTypes();
console.log(`[qui] compiled ${count} utility module(s)`);
