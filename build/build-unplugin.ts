/// <reference types="node" />
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildModules } from "./lib/compile";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const count = buildModules({
  root,
  source: "src/unplugin",
  output: "dist/unplugin",
});

console.log(`[qui] compiled ${count} unplugin module(s)`);
