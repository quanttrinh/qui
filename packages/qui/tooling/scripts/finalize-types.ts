/// <reference types="node" />
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createConfig } from "../config";

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

/**
 * Stencil writes a nested package.json so `index.js` stays CommonJS. Its
 * `exports` field is ignored by Node for nested packages and triggers publint,
 * so keep the file for module-type resolution and remove only that field.
 */
async function normalizeHydratePackageJson(): Promise<void> {
  if (!(await pathExists(HYDRATE_PACKAGE_JSON))) {
    return;
  }

  const source = await readFile(HYDRATE_PACKAGE_JSON, "utf8");
  const value: unknown = JSON.parse(source);

  if (typeof value !== "object" || value === null || !("exports" in value)) {
    return;
  }

  Reflect.deleteProperty(value, "exports");
  await writeFile(HYDRATE_PACKAGE_JSON, `${JSON.stringify(value, null, 2)}\n`);
  console.log("[qui] removed the ignored hydrate package exports field");
}

await referenceComponentTypes();
await normalizeHydratePackageJson();
