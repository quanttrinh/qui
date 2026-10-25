---
"@quanttrinh/qui": minor
---

Add case normalization to `qui-input`.

- Add the `textCase` property with `none`, `uppercase`, and `lowercase` modes.
- Normalize initial, controlled, typed, and pasted values before masking, so
  form values and `valuechange` details use the same case.
- Preserve the caret when case mapping changes the value length.
- Re-apply masks from the raw value so changing `textCase` or the mask does not
  consume literal digits or letters.
- Only restore the caret for input types that support the selection API.
- Set the inner input's native `autocapitalize` hint from `textCase`, with an
  `autocapitalizeHint` override. `number` inputs do not derive a hint from
  `textCase`.
- Document CSS `::part(input)` for display-only casing that should not change
  the submitted value.
