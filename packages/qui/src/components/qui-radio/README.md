# `qui-radio-group`

MD3 radio group composed from a group root and `qui-radio` items.

## Tags

| Tag               | Summary                                             |
| ----------------- | --------------------------------------------------- |
| `qui-radio-group` | Form-associated group: selection, orientation, ARIA |
| `qui-radio`       | One radio option                                    |

## Usage

```html
<qui-radio-group name="plan" value="pro">
    <qui-radio value="free">Free</qui-radio>
    <qui-radio value="pro">Pro</qui-radio>
    <qui-radio value="business">Business</qui-radio>
</qui-radio-group>
```

## Properties

| Tag               | Property        | Attribute         | Type                         | Default      | Description                          |
| ----------------- | --------------- | ----------------- | ---------------------------- | ------------ | ------------------------------------ |
| `qui-radio-group` | `value`         | `value` (mutable) | `string`                     | —            | Controlled selected value            |
| `qui-radio-group` | `defaultValue`  | `default-value`   | `string`                     | —            | Initial value for uncontrolled use   |
| `qui-radio-group` | `name`          | `name`            | `string`                     | —            | Form field name shared by the radios |
| `qui-radio-group` | `disabled`      | `disabled`        | `boolean`                    | `false`      | Disables the whole group             |
| `qui-radio-group` | `invalid`       | `invalid`         | `boolean`                    | `false`      | Marks the group invalid              |
| `qui-radio-group` | `required`      | `required`        | `boolean`                    | `false`      | Marks the group required             |
| `qui-radio-group` | `readOnly`      | `read-only`       | `boolean`                    | `false`      | Makes the group read-only            |
| `qui-radio-group` | `orientation`   | `orientation`     | `"horizontal" \| "vertical"` | `"vertical"` | Layout orientation                   |
| `qui-radio-group` | `textDirection` | `text-direction`  | `"ltr" \| "rtl"`             | —            | Text direction                       |
| `qui-radio`       | `value`         | `value`           | `string`                     | —            | Submitted value (required)           |
| `qui-radio`       | `disabled`      | `disabled`        | `boolean`                    | `false`      | Disables this option                 |
| `qui-radio`       | `invalid`       | `invalid`         | `boolean`                    | `false`      | Marks this option invalid            |
| `qui-radio`       | `label`         | `label`           | `string`                     | —            | Plain-text label fallback            |

## Events

| Tag               | Event         | Detail                           | Description                            |
| ----------------- | ------------- | -------------------------------- | -------------------------------------- |
| `qui-radio-group` | `valuechange` | `{ value: string \| undefined }` | Emitted whenever the selection changes |

## Methods

| Tag               | Method                   | Returns                        | Description                                          |
| ----------------- | ------------------------ | ------------------------------ | ---------------------------------------------------- |
| `qui-radio-group` | `focusControl(options?)` | `Promise<void>`                | Focuses the selected radio, or the first enabled one |
| `qui-radio-group` | `getValue()`             | `Promise<string \| undefined>` | Current value, including uncontrolled changes        |
| `qui-radio`       | `focusControl(options?)` | `Promise<void>`                | Focuses this radio's native input                    |

## Slots

| Tag               | Slot        | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| `qui-radio-group` | _(default)_ | `qui-radio` items                    |
| `qui-radio`       | _(default)_ | Label content; falls back to `label` |

## CSS parts

| Tag               | Part      | Description          |
| ----------------- | --------- | -------------------- |
| `qui-radio-group` | `root`    | Group root           |
| `qui-radio`       | `control` | Visual radio control |
| `qui-radio`       | `label`   | Label region         |

## CSS custom properties

| Property                       | Default                     | Description            |
| ------------------------------ | --------------------------- | ---------------------- |
| `--qui-radio-checked-color`    | `--md-sys-color-primary`    | Checked border and dot |
| `--qui-radio-outline-color`    | `--md-sys-color-outline`    | Unchecked border       |
| `--qui-radio-error-color`      | `--md-sys-color-error`      | Invalid border         |
| `--qui-radio-label-color`      | `--md-sys-color-on-surface` | Label text             |
| `--qui-radio-focus-ring-color` | `--md-sys-color-primary`    | Focus ring             |

## Behavior

- A disabled or read-only group blocks selection changes.
- Arrow, Home, and End keys move between radios; the group manages a single tab
  stop.
- Works with `qui-field`; field state overrides local disabled/invalid/required.
- The group root renders form ARIA only, so selection/focus updates notify the
  affected radios without re-rendering the root.

## Related

- [`RadioGroupController`](./controller.md)
- [`qui-field`](../qui-field/README.md)
