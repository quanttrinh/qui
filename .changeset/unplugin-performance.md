---
"@quanttrinh/qui": minor
---

Speed up auto-registration discovery.

- Skip AST parsing for modules that cannot contain a static `qui-*` tag.
- Use unplugin v3 hook filters so unrelated modules, virtual modules, and
  dependencies never reach the resolve, load, or transform handlers.
- Cache component extraction per module and invalidate it when the source
  changes.
- Emit boundary-resolution source maps without embedded source content.
- Traverse the Oxc AST iteratively to avoid deep recursion on large modules.
