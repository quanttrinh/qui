# ComboboxInputController

Text and query state for `qui-combobox`: controlled input value, debounced
filtering, the filtered-item cache, and input events.

## Role

Component controller. Extends `ReactiveControllerBase`; lives beside
`qui-combobox` (select has no query field).

## Options

| Option               | Type                                | Description                             |
| -------------------- | ----------------------------------- | --------------------------------------- |
| `getControlledValue` | `() => string \| undefined`         | Controlled text from `value`            |
| `getFilter`          | `() => ComboboxFilter \| undefined` | Custom filter                           |
| `getFilterMode`      | `() => ComboboxFilterMode`          | Filter mode                             |
| `getFilterDebounce`  | `() => number`                      | Query debounce in milliseconds          |
| `onInputValueChange` | `(value, reason) => void`           | Emits `inputvaluechange`                |
| `onQueryApplied`     | `() => void`                        | Called when the debounced query applies |

## API

| Member                    | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `value`                   | Controlled text when present, otherwise internal text |
| `initialize(text)`        | Seeds text and query before first render              |
| `filter(items)`           | Applies the current query/mode/filter                 |
| `handleInput(value)`      | Updates text/query and emits input change             |
| `setText(value, reason?)` | Programmatic update with optional event               |
| `setTextSilently(value)`  | Updates text/query without emitting                   |
| `syncControlled(value)`   | Updates the query for a controlled value              |
| `resetQuery()`            | Clears the timer and applies an empty query           |
| `invalidate()`            | Bumps the revision and clears the filter cache        |
| `dispose()`               | Clears pending timers                                 |

## Lifecycle

- `hostDisconnected` — calls `dispose()`.

## Notes

- `updateQuery()` applies immediately at debounce `0`; otherwise it restarts a
  timer.
- `applyQuery()` no-ops when the query is unchanged; otherwise it calls
  `onQueryApplied()` and requests a render.
- Filter invalidation goes through `invalidate()`, which changes the cache
  revision.
