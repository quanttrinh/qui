# ControlledControllerBase

Base class for controllers that own a controlled/uncontrolled value: the prop
wins when present, otherwise the controller keeps internal state.

## Role

Abstract reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option            | Type                        | Description                                           |
| ----------------- | --------------------------- | ----------------------------------------------------- |
| `getValue`        | `() => TValue \| undefined` | Controlled value; `undefined` means uncontrolled      |
| `getDefaultValue` | `() => TValue \| undefined` | Initial value for uncontrolled mode                   |
| `getFallback`     | `() => TValue`              | Used when neither controlled nor default value exists |
| `onChange`        | `(value: TValue) => void`   | Called after `commit()` changes the internal value    |
| `copy`            | `(value: TValue) => TValue` | Clones values before storing; use for arrays/objects  |

## API

| Member                                       | Description                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| `value`                                      | Controlled value when defined, otherwise internal state   |
| `initialValue`                               | Snapshot captured in `hostWillLoad()`                     |
| `reset()`                                    | Restores the initial value and runs `onValueChanged`      |
| `restore(value)`                             | Restores an external value and runs `onValueChanged`      |
| `commit(value)` (protected)                  | Stores the value, calls `onChange`, then `onValueChanged` |
| `onValueChanged(previous, next)` (protected) | Update hook; defaults to `requestUpdate()`                |

## Lifecycle

- `hostWillLoad` — seeds `initialValue` and internal state from
  `getDefaultValue()`, then `getValue()`, then `getFallback()`.
- `onValueChanged` — runs after `reset`, `restore`, and `commit`; override it to
  use `requestNotify` when the host template does not read the value.

## Notes

- `reset()` and `restore()` intentionally do not call `onChange`; components
  emit their own events from `onChange`.
- In controlled mode internal state may advance ahead of the prop until the
  parent re-renders; `value` always reads the prop first.
- `copy` prevents internal state from aliasing props or caller-owned arrays.
- Used as the base for `CheckableController`, `OptionSelectionController`,
  `AccordionController`, `TabsController`, and `RadioGroupController`.
