---
"@quanttrinh/qui": patch
---

Expose Stencil's global HTML element declarations from the package root.

Importing `@quanttrinh/qui` now loads `HTMLQui*Element` types and the
`Components` namespace, so consumers no longer need to define custom
`HTMLElement & { ... }` intersections for component elements.
