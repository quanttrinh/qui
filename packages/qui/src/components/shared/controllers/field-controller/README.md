# FieldController

Provider side of `qui-field`: generated ids, field state, part registration,
context publication, and notifications.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option          | Type                                   | Description                  |
| --------------- | -------------------------------------- | ---------------------------- |
| `getFieldId`    | `() => string \| undefined`            | Base id override (`fieldId`) |
| `getElementIds` | `() => Partial<FieldIds> \| undefined` | Per-part id overrides        |
| `isInvalid`     | `() => boolean`                        | Field invalid state          |
| `isDisabled`    | `() => boolean`                        | Field disabled state         |
| `isReadOnly`    | `() => boolean`                        | Field read-only state        |
| `isRequired`    | `() => boolean`                        | Field required state         |

## API

| Member     | Description                             |
| ---------- | --------------------------------------- |
| `ids`      | Resolved `FieldIds` for all field parts |
| `notify()` | Wakes every field subscriber            |

`FieldApi`, published through context:

| Member                                                                           | Description                          |
| -------------------------------------------------------------------------------- | ------------------------------------ |
| `ids`                                                                            | Current ids                          |
| `invalid` / `disabled` / `readOnly` / `required`                                 | State getters                        |
| `getInputProps` / `getLabelProps` / `getHelperTextProps` / `getErrorTextProps`   | Prop builders                        |
| `getLabelHost` / `getHelperTextHosts` / `getErrorTextHosts`                      | Cross-shadow ARIA targets            |
| `registerLabel` / `registerHelperText` / `registerErrorText` / `registerControl` | Part registration                    |
| `focusControl` / `clickControl`                                                  | Label-click routing                  |
| `subscribe`                                                                      | State and registration notifications |

## Lifecycle

- `hostWillLoad` — captures the authored host id before render overwrites it,
  builds the `FieldApi`, and provides the context.
- `hostConnected` — re-provides the context after reconnect.
- `hostDisconnected` — clears the provided context.

## Notes

- Id resolution: `base = fieldId ?? authored host id ?? generated id`, with
  separate `*Id` overrides per part.
- The authored id is captured in `hostWillLoad` because the first render writes
  the generated root id onto the host.
- `registerPart()` notifies around both registration and teardown, so controls
  can re-apply ARIA relationships when a label/helper/error appears or leaves.
