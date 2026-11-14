# RadioGroupController

Selected and focused state for `qui-radio-group`, plus native input registration
for label-driven focus.

## Role

Component controller. Extends
`ControlledControllerBase<string | undefined>`; lives beside `qui-radio-group`.

## Options

| Option                      | Type                        | Description                            |
| --------------------------- | --------------------------- | -------------------------------------- |
| `getValue`                  | `() => string \| undefined` | Controlled selected value              |
| `getDefaultValue`           | `() => string \| undefined` | Initial selected value                 |
| `isDisabled` / `isReadOnly` | `() => boolean`             | Blocks selection                       |
| `onChange`                  | `(value) => void`           | Emits `valuechange` and syncs the form |

## API

| Member                               | Description                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `focusedValue` / `focusVisibleValue` | Focus state                                                                   |
| `select(value)`                      | Commits unless disabled, read-only, or unchanged                              |
| `registerInput(value, input)`        | Registers a native input; returns unregister                                  |
| `focusInput(options?)`               | Focuses the selected input, falling back to the first enabled connected input |
| `focus(value, focusVisible)`         | Records focus                                                                 |
| `blur()`                             | Clears focus                                                                  |

## Lifecycle

- `hostWillLoad` — inherited from `ControlledControllerBase`; seeds the initial
  value.
- `onValueChanged` — notifies the previous and next values without rendering the
  group root.

## Notes

- The group root renders form ARIA and layout only, so selection and focus use
  `requestNotify`, not `requestUpdate`.
- Only the affected radios re-render because notifications are scoped with
  `uniqueValues`.
- Label clicks from `qui-field` are routed through the registered control handle
  and call `focusInput()`.
