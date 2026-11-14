# OptionSelectionController

Selection state shared by select and combobox.

## Role

Reactive controller. Extends `ControlledControllerBase<string[]>`.

## Options

| Option            | Type                                   | Description                          |
| ----------------- | -------------------------------------- | ------------------------------------ |
| `getValue`        | `() => string[] \| undefined`          | Controlled selected values           |
| `getDefaultValue` | `() => readonly string[] \| undefined` | Initial values                       |
| `getItems`        | `() => readonly TItem[]`               | Items used to resolve change details |
| `getMultiple`     | `() => boolean`                        | Multi-select behavior                |
| `getDeselectable` | `() => boolean`                        | Clicking the selected item clears it |
| `isReadOnly`      | `() => boolean`                        | Blocks commits                       |
| `onChange`        | `({ value, items }) => void`           | Called after a commit                |

## API

| Member          | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| `selected`      | Current values                                              |
| `select(value)` | Selects/deselects one item; returns the item or `undefined` |
| `apply(values)` | Commits raw values, used by custom combobox input           |

## Lifecycle

- `hostWillLoad` — inherited from `ControlledControllerBase`; seeds the initial
  selection.

## Notes

- Unknown values, disabled items, and read-only controls do not commit.
- Multiple mode toggles the value; single mode replaces the selection.
- `deselectable` clears the selection when the active item is chosen again.
- `onChange` receives resolved item objects so components need no second lookup.
- Values are copied on commit to avoid aliasing props.
