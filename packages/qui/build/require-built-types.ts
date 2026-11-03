/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const frameworks = ["react", "solid", "preact"] as const;
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports?: Record<string, { default?: string; types?: string }>;
};
const problems: string[] = [];

for (const framework of frameworks) {
  const entry = manifest.exports?.[`./types/${framework}`];
  if (typeof entry?.types !== "string" || typeof entry.default !== "string") {
    problems.push(`package.json is missing ./types/${framework} types/default exports`);
    continue;
  }

  for (const file of [entry.types, entry.default]) {
    if (!existsSync(join(root, file))) {
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
