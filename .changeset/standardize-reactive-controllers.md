---
"@quanttrinh/qui": minor
---

Standardize reactive controllers around a self-registering Lit-style base class. Controllers now receive the component instance in their constructor, use `hostElement`, and schedule renders through `host.requestUpdate()`.
