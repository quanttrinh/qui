---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Apply form value and validity on every form sync instead of caching a string signature, so late validation anchors and native validity changes are always reflected.
- Cover a checkbox whose `required` state comes from a wrapping `qui-field`.
