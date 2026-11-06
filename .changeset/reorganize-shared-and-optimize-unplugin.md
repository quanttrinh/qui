---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": patch
---

Reorganize shared component internals into focused `aria`, `context`, `controllers`, `dom`, `forms`, `option`, and `styles` modules, and move test utilities and smoke coverage under `tests/`. Controller state and comparison guards were simplified, and stricter type-aware linting plus shared tooling ignore patterns were enabled.

The unplugin now uses async Oxc parsing with in-flight parse deduplication and cached stylesheet reads, reducing repeated work during transforms and development rebuilds.
