---
"@quanttrinh/qui": patch
---

Separate test builds from demo and package outputs.

- Exclude test files, test utilities, and Vitest configuration from Stencil
  builds and dev watch.
- Build the test lazy loader into `.stencil-test` only when
  `NODE_ENV=test`.
- Keep the `www` output for the demo and development server only.
- Split integration, browser, and smoke tests into dedicated Vitest projects and
  declare Playwright directly.
