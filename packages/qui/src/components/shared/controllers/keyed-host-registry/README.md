# KeyedHostRegistry

Value-keyed registry of mounted parts, kept in registration order.

## Role

Support utility. Not a reactive controller.

## Options

| Option     | Type                                  | Description                                          |
| ---------- | ------------------------------------- | ---------------------------------------------------- |
| `onChange` | `(value?: string) => void` (optional) | Receives the affected value, or `undefined` on clear |

## API

| Member                               | Description                                       |
| ------------------------------------ | ------------------------------------------------- |
| `register(value, entry, sameEntry?)` | Stores an entry; returns an idempotent unregister |
| `get(value)`                         | Entry for a value                                 |
| `values()`                           | Entries in registration order                     |
| `clear()`                            | Removes every entry and calls `onChange()`        |

## Lifecycle

None — registration is DOM-free and driven by the owner.

## Notes

- Re-registering an equivalent entry under the same key is a no-op; callers pass
  `sameEntry` when equality is not identity (e.g. `sameTriggerRegistration`).
- An unregister only removes the entry it created, so replacement registrations
  are unaffected.
- Controllers use the reported value to scope notifications to the affected
  parts only.
- Extended by `RovingFocusRegistry`, which adds document ordering, an enabled
  cache, `focusTrigger`, and `edge`.
