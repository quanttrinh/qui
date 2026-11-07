import { readFile, writeFile } from "node:fs/promises";

/**
 * Removes the nested `exports` field Stencil writes to the hydrate package.
 *
 * The file must remain so `index.js` resolves as CommonJS under the root
 * package's `"type": "module"`, but Node ignores `exports` in nested packages.
 */
export async function normalizeHydratePackageJson(file: string): Promise<boolean> {
  let source: string;

  try {
    source = await readFile(file, "utf8");
  } catch {
    return false;
  }

  const value: unknown = JSON.parse(source);

  if (typeof value !== "object" || value === null || !("exports" in value)) {
    return false;
  }

  Reflect.deleteProperty(value, "exports");
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
  return true;
}
