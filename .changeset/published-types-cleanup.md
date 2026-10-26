---
"@quanttrinh/qui": patch
---

Keep test-only declarations out of published types.

`dist/types` no longer contains declarations for tests, test utilities, or
Vitest setup. Stencil now uses a build-only `tsconfig.build.json`.
