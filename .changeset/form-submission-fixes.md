---
"@quanttrinh/qui": patch
---

Fix form integration for custom controls:

- Reflect the `name` prop to a `name` attribute on input, checkbox, switch, radio group, select, and combobox so form-associated elements participate in `FormData` submission.
- Make `qui-button` with `type="submit"` or `type="reset"` operate on its associated light-DOM form. The internal shadow button has no form owner, so this action is bridged explicitly. The `form` attribute is supported with native precedence, and submission is deferred so light-DOM click handlers can cancel it.
- Keep multiple select and combobox form values in sync when the reflected `name` changes.
