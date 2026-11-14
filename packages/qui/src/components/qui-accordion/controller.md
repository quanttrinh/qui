# AccordionController

Expanded and focused state for `qui-accordion`, including trigger/content
registration, multi-expand rules, and keyboard navigation.

## Role

Component controller. Extends `ControlledControllerBase<string[]>`; lives beside
`qui-accordion`.

## Options

| Option            | Type                          | Description                                   |
| ----------------- | ----------------------------- | --------------------------------------------- |
| `getValue`        | `() => string[] \| undefined` | Controlled expanded values                    |
| `getDefaultValue` | `() => string[] \| undefined` | Initial expanded values                       |
| `getMultiple`     | `() => boolean`               | Whether several items may be open             |
| `getCollapsible`  | `() => boolean`               | Whether an open item may close in single mode |
| `onChange`        | `(value: string[]) => void`   | Emits `valuechange`                           |

## API

| Member                                    | Description                             |
| ----------------------------------------- | --------------------------------------- |
| `focusedValue`                            | Focused item value                      |
| `registerTrigger(value, host, trigger)`   | Registers a trigger; returns unregister |
| `registerContent(value, host)`            | Registers content; returns unregister   |
| `getTrigger(value)` / `getContent(value)` | Counterpart lookups                     |
| `focusTrigger(value)`                     | Focuses the internal trigger button     |
| `invalidateTriggers()`                    | Clears the enabled-trigger cache        |
| `toggle(value)`                           | Expands or collapses an item            |
| `focus(value)` / `blur()`                 | Focus transitions                       |
| `move(fromValue, delta)`                  | Arrow-key movement                      |
| `edge("first" \| "last")`                 | Home/End movement                       |

## Lifecycle

- `hostWillLoad` — inherited from `ControlledControllerBase`; seeds the expanded
  values.

## Notes

- Toggle closes only when `multiple` or `collapsible` allows it; single mode
  replaces the array, multiple adds/removes.
- The root template only reads props, so the controller uses `requestNotify`
  with the previous/next values (or the registered value) instead of
  `requestUpdate`.
- `triggers` is a `RovingFocusRegistry`; `contents` is a `KeyedHostRegistry`.
- Registration changes notify only the affected value, so only that item's parts
  re-render.
