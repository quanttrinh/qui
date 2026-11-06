import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";
import { toolIgnorePatterns } from "../../tooling/ignore";

export default defineConfig({
  // `extends` only inherits rules, plugins, and overrides, so carry the
  // remaining shared settings over explicitly. `options` stays root-only.
  categories: baseConfig.categories,
  env: {
    builtin: true,
    node: true,
  },
  extends: [baseConfig],
  ignorePatterns: [...toolIgnorePatterns],
  rules: {
    // The server package is Node-only and writes registration manifests.
    "import/no-nodejs-modules": "off",
  },
});
