# ContextPartController

Connects a part component to its nearest ancestor context provider and owns the
retry, subscription, and teardown lifecycle.

## Role

Reactive controller. Extends `ReactiveControllerBase`. Extended by
`FieldPartController`.

## Options

| Option      | Type                                                | Description                                  |
| ----------- | --------------------------------------------------- | -------------------------------------------- |
| `context`   | `ContextSource<TContext>`                           | Context store to consume                     |
| `setup`     | `(context) => (() => void) \| undefined` (optional) | Side effect after attach; returns teardown   |
| `update`    | `(context) => void` (optional)                      | Custom notification handler; default renders |
| `subscribe` | `boolean` (optional)                                | Set `false` to skip state subscriptions      |
| `getKey`    | `() => string \| undefined` (optional)              | Part value for scoped notifications          |
| `select`    | `(context) => unknown` (optional)                   | Snapshot of context values the part renders  |
| `equals`    | `(previous, next) => boolean` (optional)            | Snapshot comparison; defaults to `Object.is` |

## API

| Member             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `context` (getter) | The attached context, or `undefined` while waiting |

## Lifecycle

- `hostConnected` — starts provider listening and updates if the context is
  already attached and loaded.
- `hostWillLoad` — starts provider listening and attaches before first render.
- `hostDidLoad` — marks loaded and attaches/updates when a provider is present.
- `hostDisconnected` — stops listening, unsubscribes, runs `setup` teardown, and
  drops the context.

## Notes

- Attach is idempotent: consuming the same context again does nothing.
- `start()` subscribes to availability through the context store, so parts
  upgrade correctly even when they connect before their provider exists.
- `subscribe(listener, key?)` lets keyed `ListenerStore` providers skip parts
  whose value did not change. The key is read at notification time.
- With `select`, the part subscribes without a key and compares snapshots
  itself. This lets providers call `notify()` without computing changed keys.
  Return primitives, or pass `equals` (e.g. `shallowEqual`) for arrays.
- `select` takes precedence over `getKey`.
- When `update` is omitted, notifications call `requestUpdate()` on the host;
  custom handlers (e.g. dialog attributes) can avoid a render entirely.
