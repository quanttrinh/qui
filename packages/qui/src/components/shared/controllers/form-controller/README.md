# FormController

Form-associated integration shared by every editable control: form value,
validity, reset/restore, field association, and disabled propagation.

## Role

Reactive controller. Extends `ReactiveControllerBase`.

## State

```ts
interface FormState {
    name: string | undefined;
    multiple: boolean;
    values: readonly string[];
    formValue?: string | File | FormData | null;
    validationElement?: HTMLElement;
}
```

`state()` is the single source of truth for the submitted value and validation
anchor. `formValue` is only needed when the submit value differs from `values`,
for example an unchecked checkbox that must submit `null`.

## Options

| Option                                                       | Type                                       | Description                                     |
| ------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------- |
| `internals`                                                  | `() => ElementInternals`                   | Host internals                                  |
| `state`                                                      | `() => FormState`                          | Current value and validation anchor             |
| `validity`                                                   | `(state, form) => FormValidity` (optional) | Custom validity; defaults to required/invalid   |
| `getDisabled` / `getReadOnly` / `getRequired` / `getInvalid` | `() => boolean`                            | Host-level state used when no field is attached |
| `onReset` / `onRestore`                                      | callbacks                                  | Component-owned state updates                   |
| `onChange`                                                   | `() => void` (optional)                    | Field state changed                             |

## API

| Member                                                   | Description                                               |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `fieldApi`                                               | Nearest `FieldApi`, or `undefined`                        |
| `isDisabled` / `isReadOnly` / `isRequired` / `isInvalid` | Field value when present, otherwise host prop             |
| `setControl(handle)`                                     | Registers the control's focus/click handle with the field |
| `setDisabled(disabled)`                                  | Form-disabled path: notify, request render, sync          |
| `reset()`                                                | Runs `onReset`, then syncs                                |
| `restore(state)`                                         | Restores the submitted value, runs `onRestore`, syncs     |
| `sync()`                                                 | Writes form value when raw inputs change, plus validity   |

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
- `sync()` uses `shallowEqual` on the raw value inputs (disabled, name,
  multiple, values) to skip `setFormValue()` when nothing changed. Validity is
  always written because `setValidity()` is cheap and idempotent, which keeps
  late validation anchors correct.
- The submitted value doubles as the restore state. Single-value controls
  restore from a string; multi-value controls restore from `FormData` entries.
- Disabled controls submit `null` and report no validity. `sync()` is a no-op
  during SSR.
- `FormControlMixin` forwards `formResetCallback`, `formDisabledCallback`, and
  `formStateRestoreCallback` to `reset()`, `setDisabled()`, and `restore()`.
