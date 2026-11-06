/// <reference types="node" />
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createBuildConfig } from "../config";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const build = createBuildConfig(root);
const COMPONENT_TYPE_REFERENCE = '/// <reference path="./components.d.ts" />\n';

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
  if (!(await pathExists(build.file.componentTypes))) {
    throw new Error(`[qui] missing Stencil component types: ${build.file.componentTypes}`);
  }
  if (!(await pathExists(build.file.typesEntry))) {
    throw new Error(`[qui] missing package type entry: ${build.file.typesEntry}`);
  }

  const source = await readFile(build.file.typesEntry, "utf8");
  if (source.startsWith(COMPONENT_TYPE_REFERENCE)) {
    console.log("[qui] component type reference already present");
    return;
  }

  await writeFile(build.file.typesEntry, `${COMPONENT_TYPE_REFERENCE}${source}`);
  console.log("[qui] linked Stencil component types from package type entry");
}

await referenceComponentTypes();
