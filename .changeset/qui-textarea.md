---
"@quanttrinh/qui": minor
---

Add `qui-textarea`.

- Multi-line form-associated text control with `value`, `defaultValue`, validation,
  reset, and state restoration.
- Inherits `qui-field` ids, labels, helper text, error text, and disabled,
  read-only, required, and invalid state.
- Supports `rows`, native `resize="vertical"`, `resize="none"`, and auto-growth
  with `resize="auto"` plus an optional `maxRows` cap.
- Adds an optional character counter with `showCount`, including `current/max`
  when `maxLength` is set.
- Emits `valuechange` with the current value.
