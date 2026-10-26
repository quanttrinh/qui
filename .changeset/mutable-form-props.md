---
"@quanttrinh/qui": patch
---

Allow form controls to update controlled properties during form reset and state restoration.

`qui-input`, `qui-textarea`, `qui-radio-group`, `qui-checkbox`, and `qui-switch` now declare their internally updated `value` or `checked` prop as mutable. This removes Stencil mutability warnings without changing their public API.
