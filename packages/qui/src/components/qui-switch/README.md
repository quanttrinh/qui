# `qui-switch`

MD3 switch. Form-associated; checked state is boolean (no indeterminate).

## Tags

| Tag          | Summary                |
| ------------ | ---------------------- |
| `qui-switch` | Form-associated switch |

## Usage

```html
<qui-switch label="Wi-Fi"></qui-switch>

<form>
    <qui-switch name="notifications" value="enabled">Notifications</qui-switch>
</form>
```

## Properties

| Tag          | Property         | Attribute           | Type      | Default | Description                                    |
| ------------ | ---------------- | ------------------- | --------- | ------- | ---------------------------------------------- |
| `qui-switch` | `checked`        | `checked` (mutable) | `boolean` | —       | Controlled state; leave unset for uncontrolled |
| `qui-switch` | `defaultChecked` | `default-checked`   | `boolean` | —       | Initial state for uncontrolled use             |
| `qui-switch` | `disabled`       | `disabled`          | `boolean` | `false` | Disables the control                           |
| `qui-switch` | `invalid`        | `invalid`           | `boolean` | `false` | Marks the control invalid                      |
| `qui-switch` | `required`       | `required`          | `boolean` | `false` | Marks the control required                     |
| `qui-switch` | `readOnly`       | `read-only`         | `boolean` | `false` | Makes the control read-only                    |
| `qui-switch` | `name`           | `name`              | `string`  | —       | Form field name                                |
| `qui-switch` | `value`          | `value`             | `string`  | `"on"`  | Form field value when checked                  |
| `qui-switch` | `label`          | `label`             | `string`  | —       | Plain-text label fallback                      |

## Events

| Tag          | Event           | Detail                 | Description                                |
| ------------ | --------------- | ---------------------- | ------------------------------------------ |
| `qui-switch` | `checkedchange` | `{ checked: boolean }` | Emitted whenever the checked state changes |

## Methods

| Tag          | Method                   | Returns            | Description                                 |
| ------------ | ------------------------ | ------------------ | ------------------------------------------- |
| `qui-switch` | `focusControl(options?)` | `Promise<void>`    | Focuses the internal native input           |
| `qui-switch` | `getChecked()`           | `Promise<boolean>` | Current state, including uncontrolled edits |

## Slots

| Tag          | Slot        | Description                          |
| ------------ | ----------- | ------------------------------------ |
| `qui-switch` | _(default)_ | Label content; falls back to `label` |

## CSS parts

| Tag          | Part      | Description           |
| ------------ | --------- | --------------------- |
| `qui-switch` | `root`    | Label/control wrapper |
| `qui-switch` | `input`   | Hidden native input   |
| `qui-switch` | `control` | Track                 |
| `qui-switch` | `thumb`   | Thumb                 |
| `qui-switch` | `label`   | Label region          |

## CSS custom properties

| Property                           | Default                                    | Description              |
| ---------------------------------- | ------------------------------------------ | ------------------------ |
| `--qui-switch-track-color`         | `--md-sys-color-surface-container-highest` | Unchecked track          |
| `--qui-switch-outline-color`       | `--md-sys-color-outline`                   | Unchecked track border   |
| `--qui-switch-checked-track-color` | `--md-sys-color-primary`                   | Checked track and border |
| `--qui-switch-thumb-color`         | `--md-sys-color-outline`                   | Unchecked thumb          |
| `--qui-switch-checked-thumb-color` | `--md-sys-color-on-primary`                | Checked thumb            |
| `--qui-switch-thumb-icon-color`    | `--md-sys-color-primary`                   | Checked thumb icon       |
| `--qui-switch-error-color`         | `--md-sys-color-error`                     | Invalid border           |
| `--qui-switch-label-color`         | `--md-sys-color-on-surface`                | Label text               |
| `--qui-switch-focus-ring-color`    | `--md-sys-color-primary`                   | Focus ring               |

## Behavior

- Disabled and read-only controls do not commit from native input events.
- Works with `qui-field`; field state overrides local disabled/invalid/required.
- The native input is a checkbox with `role="switch"` semantics exposed by the
  component.

## Related

- [`CheckableController`](../shared/controllers/checkable-controller/README.md)
- [`qui-checkbox`](../qui-checkbox/README.md), [`qui-field`](../qui-field/README.md)
