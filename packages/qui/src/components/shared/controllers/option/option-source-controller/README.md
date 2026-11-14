# OptionSourceController

Supplies the item list from either the `items` property or observed DOM children.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option            | Type                                       | Description                                          |
| ----------------- | ------------------------------------------ | ---------------------------------------------------- |
| `getItems`        | `() => readonly OptionItem[] \| undefined` | Property items, or `undefined` for DOM mode          |
| `getRenderedRoot` | `() => HTMLElement \| undefined`           | Rendered list root used to ignore internal mutations |
| `adapter`         | `OptionSourceAdapter`                      | `{ observerInit, read(host) }`                       |
| `onInvalidate`    | `() => void` (optional)                    | Called when DOM items change                         |

## API

| Member         | Description                                             |
| -------------- | ------------------------------------------------------- |
| `items`        | Property items when present, otherwise cached DOM items |
| `invalidate()` | Marks the DOM cache dirty                               |

## Lifecycle

- `hostConnected` — marks the cache dirty and starts observing.
- `hostDidLoad` — ensures observation is running.
- `hostDisconnected` — disconnects the observer.

## Notes

- `items` is safe to read from `render()` every pass; DOM reads are cached until
  invalidated.
- Mutations inside the rendered list root and attribute changes on the host
  itself are ignored; anything else invalidates, calls `onInvalidate`, and
  requests a render.
- Observation is browser-only.
- The adapter isolates all knowledge of the concrete option element.
