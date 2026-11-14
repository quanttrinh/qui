# OptionListNavigationController

Open state, active item, keyboard navigation, and reveal behavior for the shared
option listbox.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option                                    | Type                                    | Description               |
| ----------------------------------------- | --------------------------------------- | ------------------------- |
| `getItems`                                | `() => readonly TItem[]`                | Items in render order     |
| `getInitialActive`                        | `() => string \| undefined`             | Active value when opening |
| `getOpen`                                 | `() => boolean \| undefined` (optional) | Controlled open state     |
| `getDefaultOpen`                          | `() => boolean` (optional)              | Initial open state        |
| `isDisabled` / `isReadOnly` / `isLooping` | `() => boolean`                         | Interaction state         |
| `onOpenChange`                            | `(open, reason) => void` (optional)     | Open/close notification   |
| `onReveal`                                | `(index) => void`                       | Active item changed       |

## API

| Member                           | Description                             |
| -------------------------------- | --------------------------------------- |
| `open`                           | Current open state                      |
| `activeValue`                    | Highlighted item value                  |
| `openMenu(reason)`               | Opens unless disabled/read-only         |
| `closeMenu(reason)`              | Closes and clears active/revealed state |
| `toggleMenu(reason)`             | Opens or closes                         |
| `setActive(value)`               | Sets the highlight                      |
| `move(delta)`                    | Moves through enabled items             |
| `edge("first" \| "last")`        | Highlights an edge                      |
| `findByPrefix(prefix)`           | Typeahead lookup                        |
| `handleNavigationKey({ event })` | Handles Arrow/Home/End; returns handled |

## Lifecycle

- `hostWillLoad` — opens when the controlled/default state requires it and marks
  the initial active item.
- `hostDidRender` — clears an active value that no longer exists and calls
  `onReveal` when the active item changed.

## Notes

- Every state change calls `requestUpdate()` because the listbox template reads
  `open` and `activeValue`.
- `handleNavigationKey` returns `false` for unhandled keys so callers can fall
  through to their own behavior.
