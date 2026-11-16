# FormController

Form-associated integration shared by every editable control: form value,
validity, reset/restore, field association, and disabled propagation.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## Options

| Option                                                       | Type                                                  | Description                                     |
| ------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- |
| `getInternals`                                               | `() => ElementInternals`                              | Host internals                                  |
| `getName` / `getMultiple` / `getValue`                       | Value source                                          | Form value inputs                               |
| `getDisabled` / `getReadOnly` / `getRequired` / `getInvalid` | `() => boolean`                                       | Host-level state used when no field is attached |
| `getValidationElement`                                       | `() => HTMLElement \| undefined`                      | Focusable element reported with validity        |
| `onReset` / `onRestore`                                      | callbacks                                             | Component-owned state updates                   |
| `onChange`                                                   | `() => void` (optional)                               | Field state changed                             |
| `getFormValue`                                               | `() => string \| File \| FormData \| null` (optional) | Overrides default form value                    |
| `getValidity`                                                | `() => FormValidity` (optional)                       | Overrides default validity                      |

## API

| Member                                                   | Description                                               |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `fieldApi`                                               | Nearest `FieldApi`, or `undefined`                        |
| `isDisabled` / `isReadOnly` / `isRequired` / `isInvalid` | Field value when present, otherwise host prop             |
| `setControl(handle)`                                     | Registers the control's focus/click handle with the field |
| `setDisabled(disabled)`                                  | Form-disabled path: notify, request render, sync          |
| `reset()`                                                | Runs `onReset`, then syncs                                |
| `restore(state)`                                         | Parses JSON string state, runs `onRestore`, syncs         |
| `sync()`                                                 | Writes form value when changed, and validity              |

## Lifecycle

- `hostWillLoad` — discovers a field and registers the control.
- `hostConnected` — re-discovers/re-registers; renders when a field attaches
  after load.
- `hostDidLoad` — performs the first sync.
- `hostDidRender` — re-syncs the current form value and validity.
- `hostDisconnected` — unsubscribes and unregisters the control.

## Notes

- Field state wins over the control's own props, so a disabled field disables
  all controls.
- `sync()` writes the form value only when it changed, but always writes
  validity. `setValidity()` is cheap and idempotent, which keeps a late
  validation anchor correct without a separate change signature.
- Disabled controls submit `null` and report no validity. `sync()` is a no-op
  during SSR.
- `FormControlMixin` forwards `formResetCallback`, `formDisabledCallback`, and
  `formStateRestoreCallback` to `reset()`, `setDisabled()`, and `restore()`.
