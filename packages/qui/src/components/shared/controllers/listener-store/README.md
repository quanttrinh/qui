# ListenerStore

Set of change listeners for local provider-style state notifications.

## Role

Support utility. Not a reactive controller.

## Options

None.

## API

| Member                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `subscribe(listener)` | Adds a listener; returns an idempotent unsubscribe |
| `notify()`            | Notifies every listener synchronously              |
| `clear()`             | Removes every listener                             |

## Lifecycle

None — notifications are synchronous and caller-driven.

## Notes

- Owners notify unconditionally. Consumers decide whether a notification
  changes rendered state.
- Iteration matches `Set` semantics: listeners added during a notification are
  visited, listeners removed before their turn are skipped, errors propagate
  synchronously.
- A listener is identified by function identity; subscribing the same function
  twice collapses to one registration.
