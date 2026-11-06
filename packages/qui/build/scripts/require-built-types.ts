/// <reference types="node" />
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createBuildConfig } from "../config";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const build = createBuildConfig(root);

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function requireBuiltTypes(): Promise<void> {
  const manifest = JSON.parse(await readFile(build.file.packageJson, "utf8")) as {
    exports?: Record<string, { default?: string; types?: string }>;
  };
  const problems: string[] = [];

  for (const framework of build.frameworks) {
    const entry = manifest.exports?.[`./types/${framework}`];
    if (typeof entry?.types !== "string" || typeof entry.default !== "string") {
      problems.push(
        `package.json is missing ./${build.output.typesImport}/${framework} types/default exports`,
      );
      continue;
    }

    for (const file of [entry.types, entry.default]) {
      if (!(await pathExists(join(root, file)))) {
        problems.push(`missing generated file: ${file}`);
      }
    }
  }

  if (problems.length > 0) {
    console.error("[qui] framework type check cannot run:");
    for (const problem of problems) {
      console.error(`  ${problem}`);
    }
    console.error("[qui] run `bun run build` before `bun run test:framework-types`");
    process.exit(1);
  }
}

await requireBuiltTypes();
