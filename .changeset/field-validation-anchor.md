---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Include the validation anchor identity in the form sync signature so a late anchor update refreshes `ElementInternals.setValidity`.
- Cover a checkbox whose `required` state comes from a wrapping `qui-field`.
