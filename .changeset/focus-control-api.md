---
"@quanttrinh/qui": minor
---

Rename the public form-control focus method to `focusControl()`.

`qui-input`, `qui-textarea`, `qui-select`, `qui-combobox`, `qui-checkbox`,
`qui-switch`, and `qui-radio-group` expose `focusControl(options?)` instead of
`focus(options?)`. This avoids colliding with the reserved
`HTMLElement.focus()` method and makes the shadow-DOM focus target explicit.

```ts
await input.focusControl();
await select.focusControl({ preventScroll: true });
```
