# `qui-field`

Groups a form control with its label, helper text, error text, and required
marker. The field owns ids and disabled/invalid/read-only/required state;
descendant controls read it through a DOM context.

## Tags

| Tag                            | Summary                              |
| ------------------------------ | ------------------------------------ |
| `qui-field`                    | Field provider and layout            |
| `qui-field-label`              | Label part                           |
| `qui-field-helper-text`        | Helper text part                     |
| `qui-field-error-text`         | Error text part, shown while invalid |
| `qui-field-required-indicator` | Required marker (default `*`)        |

## Usage

```html
<qui-field id="email" required>
    <qui-field-label>Email</qui-field-label>
    <qui-input autocomplete="email" placeholder="you@example.com"></qui-input>
    <qui-field-helper-text>We never share it.</qui-field-helper-text>
    <qui-field-error-text>Enter a valid email address.</qui-field-error-text>
</qui-field>
```

Use one field per control. Supported controls: `qui-input`, `qui-textarea`,
`qui-checkbox`, `qui-switch`, `qui-radio-group`, `qui-select`, `qui-combobox`.

## Properties

| Tag         | Property       | Attribute        | Type      | Default   | Description                                |
| ----------- | -------------- | ---------------- | --------- | --------- | ------------------------------------------ |
| `qui-field` | `fieldId`      | `field-id`       | `string`  | host id   | Base id used to derive part ids            |
| `qui-field` | `rootId`       | `root-id`        | `string`  | generated | Overrides the root id                      |
| `qui-field` | `controlId`    | `control-id`     | `string`  | generated | Overrides the control id                   |
| `qui-field` | `labelId`      | `label-id`       | `string`  | generated | Overrides the label id                     |
| `qui-field` | `errorTextId`  | `error-text-id`  | `string`  | generated | Overrides the error-text id                |
| `qui-field` | `helperTextId` | `helper-text-id` | `string`  | generated | Overrides the helper-text id               |
| `qui-field` | `invalid`      | `invalid`        | `boolean` | `false`   | Marks the field invalid                    |
| `qui-field` | `disabled`     | `disabled`       | `boolean` | `false`   | Disables the field and its controls        |
| `qui-field` | `readOnly`     | `read-only`      | `boolean` | `false`   | Makes the field and its controls read-only |
| `qui-field` | `required`     | `required`       | `boolean` | `false`   | Marks the field required                   |

## Events

None.

## Methods

None.

## Slots

| Tag                            | Slot        | Description                                 |
| ------------------------------ | ----------- | ------------------------------------------- |
| `qui-field`                    | _(default)_ | Label, control, helper text, and error text |
| `qui-field-label`              | _(default)_ | Label content                               |
| `qui-field-helper-text`        | _(default)_ | Helper text content                         |
| `qui-field-error-text`         | _(default)_ | Error text content                          |
| `qui-field-required-indicator` | _(default)_ | Custom marker content; defaults to `*`      |

## CSS parts

| Tag                            | Part                 | Description          |
| ------------------------------ | -------------------- | -------------------- |
| `qui-field`                    | `root`               | Field layout root    |
| `qui-field-label`              | `label`              | Internal label       |
| `qui-field-helper-text`        | `helper-text`        | Internal helper text |
| `qui-field-error-text`         | `error-text`         | Internal error text  |
| `qui-field-required-indicator` | `required-indicator` | Required marker      |

## CSS custom properties

| Property                       | Default                             | Description |
| ------------------------------ | ----------------------------------- | ----------- |
| `--qui-field-label-color`      | `--md-sys-color-on-surface`         | Label text  |
| `--qui-field-helper-color`     | `--md-sys-color-on-surface-variant` | Helper text |
| `--qui-field-error-text-color` | `--md-sys-color-error`              | Error text  |

The shared field-surface color properties are documented under the form controls
and also apply to descendants of this field.

## Behavior

- The field value wins over a control's own `disabled`, `readOnly`, `required`,
  and `invalid` props.
- Part ids are generated as `${base}::control`, `${base}::label`,
  `${base}::error-text`, and `${base}::helper-text` unless overridden.
- The label is wired to the control and ARIA relationships are applied across
  shadow roots; helper and error hosts are registered automatically.
- Error text is only visible while the field is invalid.

## Related

- [`FieldController`](../shared/controllers/field-controller/README.md)
- [`qui-input`](../qui-input/README.md), [`qui-textarea`](../qui-textarea/README.md),
  [`qui-checkbox`](../qui-checkbox/README.md), [`qui-switch`](../qui-switch/README.md),
  [`qui-radio`](../qui-radio/README.md), [`qui-select`](../qui-select/README.md),
  [`qui-combobox`](../qui-combobox/README.md)
