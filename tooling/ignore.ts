/**
 * Shared ignore policy for tooling configs.
 *
 * `.gitignore` and `tsconfig` use different path semantics, so they remain
 * separate, but Oxlint, Oxfmt, and Stencil can all consume this module.
 */
export const toolIgnorePatterns = [
  "node_modules/",
  "dist/",
  "styled-system/",
  "www/",
  ".stencil/",
  ".stencil-test/",
  "loader/",
  "docs/",
  ".github/",
  ".changeset/",
  ".husky/",
  ".devcontainer/",
  "CHANGELOG.md",
  "bun.lock",
] as const;

/** Test, spec, and e2e source files are not part of the Stencil build. */
export const testSourceFilePattern = /\.(?:test|spec|e2e)\.(?:ts|tsx)$/;

/** Test support files are not part of the Stencil build. */
export const testSupportPathPattern = /(?:^|\/)(?:test-utils|vitest\.(?:config|setup)\.ts)(?:\/|$)/;

export const watchIgnoredPatterns = [testSourceFilePattern, testSupportPathPattern];
