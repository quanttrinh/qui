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
| `getValidationElement`                                       | `() => HTMLElement \| undefined`                      | Element reported with validity                  |
| `onReset` / `onRestore`                                      | callbacks                                             | Component-owned state updates                   |
| `onChange`                                                   | `() => void` (optional)                               | Field state changed                             |
| `getFormValue`                                               | `() => string \| File \| FormData \| null` (optional) | Overrides default form value                    |
| `getValidity`                                                | `() => FormValidity` (optional)                       | Overrides default validity                      |
| `getSignature`                                               | `() => string` (optional)                             | Overrides the change signature                  |

## API

| Member                                                   | Description                                               |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `fieldApi`                                               | Nearest `FieldApi`, or `undefined`                        |
| `isDisabled` / `isReadOnly` / `isRequired` / `isInvalid` | Field value when present, otherwise host prop             |
| `setControl(handle)`                                     | Registers the control's focus/click handle with the field |
| `setDisabled(disabled)`                                  | Form-disabled path: notify, request render, sync          |
| `reset()`                                                | Clears signature, runs `onReset`, syncs                   |
| `restore(state)`                                         | Parses JSON string state, runs `onRestore`, syncs         |
| `sync()`                                                 | Writes form value/validity when the signature changed     |

## Lifecycle

- `hostWillLoad` — discovers a field and registers the control.
- `hostConnected` — re-discovers/re-registers; renders when a field attaches
  after load.
- `hostDidLoad` — performs the first sync.
- `hostDidRender` — re-syncs; the signature makes this a no-op when unchanged.
- `hostDisconnected` — unsubscribes and unregisters the control.

## Notes

- Field state wins over the control's own props, so a disabled field disables
  all controls.
- `sync()` includes controller-owned disabled/read-only/required/invalid flags
  in its signature, so custom signatures still refresh validity.
- Disabled controls submit `null` and report no validity. `sync()` is a no-op
  during SSR.
- `FormControlMixin` forwards `formResetCallback`, `formDisabledCallback`, and
  `formStateRestoreCallback` to `reset()`, `setDisabled()`, and `restore()`.
