/// <reference types="node" />
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildModules } from "../../../tooling/module-builder";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const count = buildModules({
  root,
  source: "src",
  output: "dist",
});

console.log(`[qui] compiled ${count} unplugin module(s)`);
