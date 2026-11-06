import { defineConfig } from "oxfmt";

import baseConfig from "../../oxfmt.config.ts";

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    "CHANGELOG.md",
    "node_modules/",
    "dist/",
    "styled-system/",
    "www/",
    ".stencil/",
    ".stencil-test/",
    "loader/",
    "docs/",
    "coverage/",
  ],
});
