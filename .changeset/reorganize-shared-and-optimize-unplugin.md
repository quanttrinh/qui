---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": patch
---

Reorganize shared component internals into focused `aria`, `context`, `controllers`, `dom`, `forms`, `option`, and `styles` modules, and move test utilities and smoke coverage under `tests/`. Controller state and comparison guards were simplified, and stricter type-aware linting plus shared tooling ignore patterns were enabled.

The unplugin uses Oxc's synchronous parser for per-module transforms, which avoids async parsing overhead, and reads the shared stylesheet on demand so watch rebuilds pick up CSS edits.
