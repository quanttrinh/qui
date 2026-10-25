---
"@quanttrinh/qui": patch
---

Render a required indicator for required checkboxes.

`qui-checkbox` now shows the same red `*` marker as field labels when
`required` is set directly or inherited from a wrapping `qui-field`. The
indicator is hidden otherwise and is exposed through the `required-indicator`
part for styling.
