/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const COMPONENT_TYPE_REFERENCE = '/// <reference path="./components.d.ts" />\n';
const TYPES_ENTRY = join(root, "dist", "types", "index.d.ts");
const COMPONENTS_ENTRY = join(root, "dist", "types", "components.d.ts");

/**
 * Ensures the package type entry includes Stencil's global element declarations
 * under every TypeScript module-resolution mode.
 */
function referenceComponentTypes(): void {
  if (!existsSync(COMPONENTS_ENTRY)) {
    throw new Error(`[qui] missing Stencil component types: ${COMPONENTS_ENTRY}`);
  }
  if (!existsSync(TYPES_ENTRY)) {
    throw new Error(`[qui] missing package type entry: ${TYPES_ENTRY}`);
  }

  const source = readFileSync(TYPES_ENTRY, "utf8");
  if (source.startsWith(COMPONENT_TYPE_REFERENCE)) {
    console.log("[qui] component type reference already present");
    return;
  }

  writeFileSync(TYPES_ENTRY, `${COMPONENT_TYPE_REFERENCE}${source}`);
  console.log("[qui] linked Stencil component types from package type entry");
}

referenceComponentTypes();
