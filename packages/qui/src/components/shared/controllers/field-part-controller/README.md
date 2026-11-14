# FieldPartController

Connects a visual `qui-field` part to its provider, assigns its generated id, and
registers it with the field.

## Role

Reactive controller. Extends `ContextPartController<FieldApi>`, so it inherits
provider retry, subscription, and teardown.

## Options

| Option   | Type                 | Description                                                   |
| -------- | -------------------- | ------------------------------------------------------------- |
| `part`   | `FieldPart`          | `label`, `helper-text`, `error-text`, or `required-indicator` |
| `styles` | `boolean` (optional) | Ensure the shadow stylesheet; default `true` only for labels  |

## API

| Member           | Description                                       |
| ---------------- | ------------------------------------------------- |
| `field` (getter) | Attached `FieldApi`, or `undefined` while waiting |

## Lifecycle

- `hostConnected` — inherited: ensures styles, attaches, and renders when a field
  is already available.
- `hostWillLoad` / `hostDidLoad` — inherited: attach before and after the first
  render.
- `hostDisconnected` — inherited: unsubscribes and runs the registration
  teardown.

## Notes

- `label`, `helper-text`, and `error-text` each assign their id from
  `FieldApi` and register the host; `required-indicator` is presentational only.
- The context key is fixed to `"field"` and consumption always uses
  `consumeField`.
- Because it subscribes to field state, a part re-renders when `disabled`,
  `invalid`, or registration targets change.
