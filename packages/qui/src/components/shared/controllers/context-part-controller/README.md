# ContextPartController

Connects a part component to its nearest ancestor provider via `context-request`
and owns the subscription, setup, and teardown lifecycle.

## Role

Reactive controller. Extends `ReactiveControllerBase`. Extended by
`FieldPartController`.

## Options

| Option      | Type                                                | Description                                     |
| ----------- | --------------------------------------------------- | ----------------------------------------------- |
| `context`   | `Context<unknown, TContext>`                        | Context key to request                          |
| `setup`     | `(context) => (() => void) \| undefined` (optional) | Side effect after attach; returns teardown      |
| `update`    | `(context) => void` (optional)                      | Custom notification handler; default renders    |
| `subscribe` | `boolean` (optional)                                | Set `false` for a one-shot request              |
| `select`    | `(context) => unknown` (optional)                   | Snapshot of context values the part renders     |
| `equals`    | `(previous, next) => boolean` (optional)            | Snapshot comparison; defaults to `shallowEqual` |
| `onNotify`  | `(context) => void` (optional)                      | Runs on every provider notification             |

## API

| Member             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `context` (getter) | The attached context, or `undefined` while waiting |

## Lifecycle

- `hostWillLoad` — dispatches the first request; the synchronous answer is
  applied without notifying (the host has not rendered yet).
- `hostConnected` — dispatches a request on reconnect; an answer notifies.
- `hostDisconnected` — unsubscribes, runs the `setup` teardown, and drops the
  context.
- There is no `hostDidLoad` hook: events answer requests synchronously, and a
  late provider is answered through the root coordinator.

## Notes

- Attaching the same context value again does nothing; a new value tears down
  the previous registration and runs `setup` again.
- A new context always notifies. Same-context updates go through `select`, so
  unchanged snapshots do not re-render the part. Without `select`, every
  notification re-renders.
- `select` must include everything the part reads from the context, including
  values used by post-render sync such as ids and registration lookups, not
  just rendered attributes.
- `onNotify` runs even when `select` filtered a render. Nested providers such
  as `qui-accordion-item` use it to wake their own subscribers.
- With `subscribe: false` the provider does not retain the callback; late
  providers are still handled through the root coordinator.
- When `update` is omitted, notifications call `requestUpdate()` on the host;
  custom handlers (e.g. dialog attributes) can avoid a render entirely.
