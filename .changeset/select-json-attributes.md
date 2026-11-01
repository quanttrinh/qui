---
"@quanttrinh/qui": minor
---

Support JSON attributes for option-control data props.

- `qui-select` and `qui-combobox` now deserialize `items`, `value`, and
  `default-value` JSON array attributes, so static HTML and SSR markup can
  provide option data and initial selection without JavaScript property
  assignment.
- Invalid `items` JSON is ignored, while single scalar `value` and
  `default-value` strings are normalized to one-item arrays for convenience.
- Documented the attribute syntax and added a browser test covering JSON
  deserialization and the initial selected state.
