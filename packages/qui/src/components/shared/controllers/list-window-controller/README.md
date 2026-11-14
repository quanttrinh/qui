# ListWindowController

List windowing for measured option lists: scroll offset, viewport measurement,
row measurements, reveal behavior, and virtualized/overflow windows.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option                 | Type           | Description                             |
| ---------------------- | -------------- | --------------------------------------- |
| `getEstimateSize`      | `() => number` | Fallback row height before measurement  |
| `fallbackViewportSize` | `number`       | Viewport height before measurement      |
| `getOverscan`          | `() => number` | Extra rows rendered beyond the viewport |

## API

| Member                       | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `getList(items, overrides?)` | Returns a `ListWindow` for the current viewport/offset |
| `setViewport(element)`       | Sets and observes the scrolling element                |
| `scrollToStart()`            | Resets scroll offset and position                      |
| `revealIndex(index)`         | Scrolls the minimum amount needed to reveal an item    |
| `handleScroll()`             | Reads the viewport's current scroll offset             |

`getList` overrides: `mode` (`"virtualize"` or `"overflow"`), `reserveSize` for
the overflow entry, and `viewportSize` to bypass measurement.

`ListWindow` fields: `total`, visible `entries`, `overflow` items, translation
`offset`, and `totalSize`.

## Lifecycle

- `hostConnected` — restores the scroll offset and re-observes the viewport.
- `hostDidRender` — reads viewport height and syncs measured rows; renders only
  when the height or a row size changed.
- `hostDisconnected` — disconnects the viewport and size observers.

## Notes

- `ListMetrics` keeps a measured prefix sum and binary search, so window
  computation does not scan all items.
- A `ResizeObserver` tracks viewport height; `ListSizeObserver` tracks rendered
  row sizes.
- `setViewport` is idempotent for the same element.
- Sizing helpers live in `helpers/list-window/model.ts`.
