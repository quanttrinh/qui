---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": patch
---

Streamline the build and theme tooling. Build paths are centralized, utility compilation runs as a Stencil output target, test and dev builds skip production-only outputs, type finalization runs automatically after production builds, and type checking now uses Oxlint's type-aware mode.

Undefined-content components are discovered from `@undefinedContent` source markers, and the color/theme helpers build role records directly while removing redundant variable helpers.
