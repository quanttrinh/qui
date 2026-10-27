import { createRequire } from "node:module";
import path from "node:path";

const requireFromPlugin = createRequire(import.meta.url);

type Resolver = () => string;

function resolveFromCwd(): string {
  return createRequire(path.join(process.cwd(), "package.json")).resolve(
    "@quanttrinh/qui/styles.css",
  );
}

/**
 * Resolves the main package's shared stylesheet through its public export.
 * The two resolver callbacks exist so packaging branches can be tested without
 * a built workspace package or a test-only environment override.
 */
export function resolveStylesheetPath(
  fromPlugin: Resolver = () => requireFromPlugin.resolve("@quanttrinh/qui/styles.css"),
  fromCwd: Resolver = resolveFromCwd,
): string {
  try {
    return fromPlugin();
  } catch {
    try {
      return fromCwd();
    } catch {
      throw new Error(
        "@quanttrinh/qui-unplugin requires @quanttrinh/qui to be installed alongside it.",
      );
    }
  }
}
