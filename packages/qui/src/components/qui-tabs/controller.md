# TabsController

Selection, focus, registration, and keyboard navigation for `qui-tabs`.

## Role

Component controller. Extends `ControlledControllerBase<string | undefined>`;
lives beside `qui-tabs`.

## Options

| Option              | Type                            | Description                              |
| ------------------- | ------------------------------- | ---------------------------------------- |
| `getValue`          | `() => string \| undefined`     | Controlled selected value                |
| `getDefaultValue`   | `() => string \| undefined`     | Initial selected value                   |
| `getActivationMode` | `() => "manual" \| "automatic"` | Select on focus or on activation         |
| `getLoopFocus`      | `() => boolean`                 | Wrap arrow navigation                    |
| `getDeselectable`   | `() => boolean`                 | Clicking the active tab clears selection |
| `onChange`          | `(value) => void`               | Emits `valuechange`                      |

## API

| Member                                                | Description                       |
| ----------------------------------------------------- | --------------------------------- |
| `focusedValue` / `hasFocus`                           | Focus bookkeeping                 |
| `registerList(host)`                                  | Registers the tab list            |
| `registerTrigger(value, host, trigger)`               | Registers a trigger               |
| `registerPanel(value, host)`                          | Registers a panel                 |
| `getList()` / `getTrigger(value)` / `getPanel(value)` | Lookups                           |
| `focusTrigger(value)`                                 | Focuses the internal button       |
| `invalidateTriggers()`                                | Clears the enabled-trigger cache  |
| `select(value)`                                       | Commits the next selection        |
| `focus(value)` / `blur()`                             | Focus transitions                 |
| `move(delta)` / `edge(edge)`                          | Arrow-key and Home/End navigation |

## Lifecycle

- `hostWillLoad` — resets `FocusState` to the initial selected tab.
- `onValueChanged` — notifies the previous/next selection keys and renders,
  because the root template shows `data-focus`.

## Notes

- `select` handles deselectable clearing, programmatic focus changes, selection
  commits, and focus-within renders.
- `move`/`edge` focus the next trigger; automatic activation then selects it,
  manual activation only moves focus.
- `triggers` is a `RovingFocusRegistry`; `panels` and `lists` are
  `KeyedHostRegistry` instances.
- Registration changes notify only the affected value; the list is unkeyed and
  always notified.
