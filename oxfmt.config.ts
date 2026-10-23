import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "CHANGELOG.md",
    "styled-system/",
    "dist/",
    "www/",
    ".stencil/",
    "node_modules/",
    "docs/",
    ".github/",
    ".changeset/",
    ".husky/",
    ".devcontainer/",
    "bun.lock",
  ],
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
