---
"@quanttrinh/qui": patch
---

Avoid collisions with the native `Element.part` property.

The context-part controllers were stored in a field named `part`. The field
helper text, error text, and required indicator render a `part` attribute on
their host element, which shadows that field with the native `DOMTokenList`.
Component lifecycle hooks then failed with
`this.part.hostDidLoad is not a function`.

Rename the internal controller to `contextPart` across all context-part
components for consistency and to prevent future host-attribute collisions.
