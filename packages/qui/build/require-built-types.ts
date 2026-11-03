/// <reference types="node" />
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const missing = ["react", "solid", "preact"]
  .map((framework) => join(root, "dist", "types", `${framework}.d.ts`))
  .filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error("[qui] missing generated framework types:");
  for (const path of missing) {
    console.error(`  ${path}`);
  }
  console.error("[qui] run `bun run build` before `bun run test:framework-types`");
  process.exit(1);
}
