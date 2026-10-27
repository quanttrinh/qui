import { createRequire } from "node:module";
import path from "node:path";

const requireFromPlugin = createRequire(import.meta.url);

function resolveFromCwd(): string {
  return createRequire(path.join(process.cwd(), "package.json")).resolve(
    "@quanttrinh/qui/styles.css",
  );
}

/**
 * Resolves the main package's shared stylesheet through its public export,
 * falling back to the consuming workspace's resolution.
 */
export function resolveStylesheetPath(): string {
  try {
    return requireFromPlugin.resolve("@quanttrinh/qui/styles.css");
  } catch {
    try {
      return resolveFromCwd();
    } catch (error) {
      throw new Error(
        "@quanttrinh/qui-unplugin requires @quanttrinh/qui to be installed alongside it.",
        { cause: error },
      );
    }
  }
}
