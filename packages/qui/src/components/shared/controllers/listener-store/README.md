# ListenerStore

Keyed set of change listeners used by context providers and appliers.

## Role

Support utility. Not a reactive controller.

## Options

None.

## API

| Member                      | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| `subscribe(listener, key?)` | Adds a listener; returns an idempotent unsubscribe                         |
| `notify(keys?)`             | Notifies all unkeyed listeners plus keyed listeners whose key is in `keys` |
| `clear()`                   | Removes every listener                                                     |

## Lifecycle

None — notifications are synchronous and caller-driven.

## Notes

- `notify()` with no keys wakes every listener. `notify(keys)` wakes unkeyed
  listeners and only keyed listeners whose `key()` returns a value in `keys`.
- Key getters are read at notification time, so a part can change its `value`
  without re-subscribing.
- Iteration matches `Set` semantics: listeners added during a notification are
  visited, listeners removed before their turn are skipped, errors propagate
  synchronously.
- A listener is identified by function identity; subscribing the same function
  twice collapses to one registration, and a later key replaces the earlier
  key. Use distinct listener closures for different keys.
- Controllers build key sets with `uniqueValues(...)`.
