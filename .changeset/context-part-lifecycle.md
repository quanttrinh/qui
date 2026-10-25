---
"@quanttrinh/qui": patch
---

Simplify context part lifecycles.

- Add a shared `consumeContextPart` helper for attach, retry, subscription, and
  teardown handling.
- Migrate the accordion, tabs, dialog, field, and radio parts to the helper.
- Remove unused accordion context members and centralize item disabled state.
