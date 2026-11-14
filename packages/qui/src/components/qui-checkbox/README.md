# `qui-checkbox`

MD3 checkbox. Form-associated, supports checked, unchecked, indeterminate,
disabled, read-only, required, and invalid states.

## Tags

| Tag            | Summary                  |
| -------------- | ------------------------ |
| `qui-checkbox` | Form-associated checkbox |

## Usage

```html
<qui-checkbox label="Accept terms"></qui-checkbox>
<qui-checkbox indeterminate>Partially selected</qui-checkbox>

<form>
    <qui-checkbox name="updates" value="yes">Send updates</qui-checkbox>
</form>
```

## Properties

| Tag            | Property         | Attribute           | Type           | Default | Description                                       |
| -------------- | ---------------- | ------------------- | -------------- | ------- | ------------------------------------------------- |
| `qui-checkbox` | `checked`        | `checked` (mutable) | `CheckedState` | —       | Controlled state; leave unset for uncontrolled    |
| `qui-checkbox` | `defaultChecked` | `default-checked`   | `CheckedState` | —       | Initial state for uncontrolled use                |
| `qui-checkbox` | `indeterminate`  | `indeterminate`     | `boolean`      | `false` | Render indeterminate instead of checked/unchecked |
| `qui-checkbox` | `disabled`       | `disabled`          | `boolean`      | `false` | Disables the control                              |
| `qui-checkbox` | `invalid`        | `invalid`           | `boolean`      | `false` | Marks the control invalid                         |
| `qui-checkbox` | `required`       | `required`          | `boolean`      | `false` | Marks the control required                        |
| `qui-checkbox` | `readOnly`       | `read-only`         | `boolean`      | `false` | Makes the control read-only                       |
| `qui-checkbox` | `name`           | `name`              | `string`       | —       | Form field name                                   |
| `qui-checkbox` | `value`          | `value`             | `string`       | `"on"`  | Form field value when checked                     |
| `qui-checkbox` | `label`          | `label`             | `string`       | —       | Plain-text label fallback                         |

## Events

| Tag            | Event           | Detail                      | Description                                |
| -------------- | --------------- | --------------------------- | ------------------------------------------ |
| `qui-checkbox` | `checkedchange` | `{ checked: CheckedState }` | Emitted whenever the checked state changes |

## Methods

| Tag            | Method                   | Returns                 | Description                                 |
| -------------- | ------------------------ | ----------------------- | ------------------------------------------- |
| `qui-checkbox` | `focusControl(options?)` | `Promise<void>`         | Focuses the internal native input           |
| `qui-checkbox` | `getChecked()`           | `Promise<CheckedState>` | Current state, including uncontrolled edits |

## Slots

| Tag            | Slot        | Description                          |
| -------------- | ----------- | ------------------------------------ |
| `qui-checkbox` | _(default)_ | Label content; falls back to `label` |

## CSS parts

| Tag            | Part                 | Description             |
| -------------- | -------------------- | ----------------------- |
| `qui-checkbox` | `root`               | Label/control wrapper   |
| `qui-checkbox` | `control`            | Visual box              |
| `qui-checkbox` | `indicator`          | Check or dash indicator |
| `qui-checkbox` | `label`              | Label region            |
| `qui-checkbox` | `required-indicator` | Required marker         |
| `qui-checkbox` | `input`              | Hidden native input     |

## CSS custom properties

| Property                             | Default                     | Description                   |
| ------------------------------------ | --------------------------- | ----------------------------- |
| `--qui-checkbox-checked-color`       | `--md-sys-color-primary`    | Checked border and background |
| `--qui-checkbox-checked-text-color`  | `--md-sys-color-on-primary` | Check/dash icon               |
| `--qui-checkbox-outline-color`       | `--md-sys-color-outline`    | Unchecked border              |
| `--qui-checkbox-hover-outline-color` | `--md-sys-color-on-surface` | Unchecked hover border        |
| `--qui-checkbox-error-color`         | `--md-sys-color-error`      | Invalid border                |
| `--qui-checkbox-label-color`         | `--md-sys-color-on-surface` | Label text                    |
| `--qui-checkbox-focus-ring-color`    | `--md-sys-color-primary`    | Focus ring                    |

## Behavior

- `indeterminate` takes precedence over `checked` for display.
- Disabled and read-only controls do not commit from native input events.
- `value` defaults to `"on"` when checked and no value is supplied.
- Works with `qui-field`; field state overrides local disabled/invalid/required.

## Related

- [`CheckableController`](../shared/controllers/checkable-controller/README.md)
- [`qui-switch`](../qui-switch/README.md), [`qui-field`](../qui-field/README.md)
