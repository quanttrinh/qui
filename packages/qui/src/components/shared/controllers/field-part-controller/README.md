# FieldPartController

Connects a visual `qui-field` part to its provider and registers it with the
field.

## Role

Reactive controller. Extends `ContextPartController<FieldApi>`, so it inherits
provider retry, subscription, and teardown.

## Options

| Option | Type        | Description                                                   |
| ------ | ----------- | ------------------------------------------------------------- |
| `part` | `FieldPart` | `label`, `helper-text`, `error-text`, or `required-indicator` |

## API

| Member           | Description                                       |
| ---------------- | ------------------------------------------------- |
| `field` (getter) | Attached `FieldApi`, or `undefined` while waiting |

## Lifecycle

- `hostConnected` — inherited: attaches and renders when a field is already
  available.
- `hostWillLoad` / `hostDidLoad` — inherited: attach before and after the first
  render.
- `hostDisconnected` — inherited: unsubscribes and runs the registration
  teardown.

## Notes

- `label`, `helper-text`, and `error-text` register the host with the field so
  it can target them with ARIA; each component owns its rendered id.
  `required-indicator` is presentational only.
- Consumption always uses the shared `fieldContext` store.
- Because it subscribes to field state, a part re-renders when `disabled`,
  `invalid`, or registration targets change.
