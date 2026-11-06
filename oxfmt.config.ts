import { defineConfig } from "oxfmt";

import { toolIgnorePatterns } from "./tooling/ignore";

export default defineConfig({
  ignorePatterns: [...toolIgnorePatterns],
  sortImports: {
    groups: [
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
  sortPackageJson: {
    sortScripts: false,
  },
});
