---
"@quanttrinh/qui": patch
---

Fix context parts that failed to attach when custom elements were registered child-first.

- Sort unplugin registrations so context providers are defined before the parts
  that consume them.
- Notify waiting parts when a provider registers, so accordion, tabs, dialog,
  field, and radio parts attach regardless of custom element definition order.
