/// <reference types="node" />
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createConfig } from "../config";
import { normalizeHydratePackageJson } from "../panda/hydrate-package";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const config = createConfig(root);
const COMPONENT_TYPE_REFERENCE = '/// <reference path="./components.d.ts" />\n';
const HYDRATE_PACKAGE_JSON = join(config.output.hydrate, "package.json");

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the package type entry includes Stencil's global element declarations
 * under every TypeScript module-resolution mode.
 */
async function referenceComponentTypes(): Promise<void> {
  if (!(await pathExists(config.file.componentTypes))) {
    throw new Error(`[qui] missing Stencil component types: ${config.file.componentTypes}`);
  }
  if (!(await pathExists(config.file.typesEntry))) {
    throw new Error(`[qui] missing package type entry: ${config.file.typesEntry}`);
  }

  const source = await readFile(config.file.typesEntry, "utf8");
  if (source.startsWith(COMPONENT_TYPE_REFERENCE)) {
    console.log("[qui] component type reference already present");
    return;
  }

  await writeFile(config.file.typesEntry, `${COMPONENT_TYPE_REFERENCE}${source}`);
  console.log("[qui] linked Stencil component types from package type entry");
}

if (await normalizeHydratePackageJson(HYDRATE_PACKAGE_JSON)) {
  console.log("[qui] removed the ignored hydrate package exports field");
}

await referenceComponentTypes();
