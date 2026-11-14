# CheckableController

Checked state, native-input synchronization, and focus-visible tracking shared
by checkbox-like controls.

## Role

Reactive controller. Extends `ControlledControllerBase<CheckedState>`, where
`CheckedState = boolean | "indeterminate"`.

## Options

| Option                  | Type                              | Description                                           |
| ----------------------- | --------------------------------- | ----------------------------------------------------- |
| `getChecked`            | `() => unknown`                   | Controlled value, normalized from attribute/property  |
| `getDefaultChecked`     | `() => unknown`                   | Initial value for uncontrolled mode                   |
| `getIndeterminate`      | `() => boolean` (optional)        | Prop-level indeterminate override                     |
| `supportsIndeterminate` | `boolean` (optional)              | Whether `"indeterminate"` is accepted; default `true` |
| `isDisabled`            | `() => boolean`                   | Blocks interaction                                    |
| `isReadOnly`            | `() => boolean`                   | Blocks commits                                        |
| `onChange`              | `(checked: CheckedState) => void` | Called with the committed state                       |

## API

| Member                          | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| `checked`                       | Effective state, honoring the indeterminate override  |
| `state`                         | `"checked"`, `"unchecked"`, or `"indeterminate"`      |
| `isChecked` / `isIndeterminate` | Boolean views of `checked`                            |
| `hasFocus` / `hasFocusVisible`  | Focus state for `data-focus` styles                   |
| `initialChecked`                | Initial state used by form reset                      |
| `normalize(value)`              | Applies the attribute/form normalization rules        |
| `setInput(input)`               | Attaches listeners and syncs the native input         |
| `toggle()`                      | Flips state; indeterminate becomes checked            |
| `setChecked(value)`             | Commits unless disabled/read-only; otherwise re-syncs |
| `syncInput()`                   | Pushes state into the native input                    |

## Lifecycle

- `hostConnected` — re-requests a render if focus was left behind on disconnect.
- `hostDidRender` — syncs `input.checked` and `input.indeterminate`.
- `hostDisconnected` — removes input listeners and remembers pending focus
  cleanup.

## Notes

- Normalization maps `true`/`"true"`/`""` to checked, `false`/`"false"` to
  unchecked, and `"indeterminate"` when supported.
- Disabled and read-only controls never commit from native input events; the
  native state is re-synced instead.
- `focusRenderPending` avoids losing a focus-state render when focus is active
  during a disconnect/reconnect cycle.
