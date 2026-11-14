# Roving focus

Shared helpers for widgets with a single tab stop and arrow-key navigation.

## Role

Support utilities. Not reactive controllers.

## Options

None.

## API

| Member                                      | Description                                       |
| ------------------------------------------- | ------------------------------------------------- |
| `TriggerRegistration`                       | `{ value, host, trigger }`                        |
| `moveIndex(entries, currentIndex, options)` | Computes the next index                           |
| `sameTriggerRegistration`                   | Equality for trigger re-registration              |
| `RovingFocusRegistry.enabled()`             | Enabled entries sorted by document order (cached) |
| `RovingFocusRegistry.focusTrigger(value)`   | Focuses the registered button                     |
| `RovingFocusRegistry.edge(edge)`            | First/last enabled trigger                        |
| `RovingFocusRegistry.invalidate()`          | Clears the enabled cache                          |

`moveIndex` options: `delta`, `loop` (wrap), `selectEdge` (default `true`; a
missing current index selects the first/last entry in the direction of travel).

## Lifecycle

None — registries are driven by the owning controller.

## Notes

- The enabled list is cached because navigation re-reads it on every key; it is
  cleared by register/unregister/clear and by `invalidate()`.
- Entries are sorted with `compareDocumentPosition` because registration order
  does not always match slotted DOM order.
- `RovingFocusRegistry` extends `KeyedHostRegistry`.
