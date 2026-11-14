# `qui-textarea`

Multi-line, form-associated text input with optional auto-growth and a character
counter. Inside `qui-field`, it inherits field ids and state.

## Tags

| Tag            | Summary                          |
| -------------- | -------------------------------- |
| `qui-textarea` | Form-associated multi-line input |

## Usage

```html
<qui-field id="bio">
    <qui-field-label>Bio</qui-field-label>
    <qui-textarea
        rows="5"
        max-length="500"
        show-count
        resize="auto"
        placeholder="Write a short bio..."
    ></qui-textarea>
    <qui-field-helper-text>Keep it under 500 characters.</qui-field-helper-text>
</qui-field>
```

## Properties

| Tag            | Property         | Attribute         | Type             | Default      | Description                                |
| -------------- | ---------------- | ----------------- | ---------------- | ------------ | ------------------------------------------ |
| `qui-textarea` | `value`          | `value` (mutable) | `string`         | —            | Controlled value                           |
| `qui-textarea` | `defaultValue`   | `default-value`   | `string`         | —            | Initial value for uncontrolled use         |
| `qui-textarea` | `name`           | `name`            | `string`         | —            | Form field name                            |
| `qui-textarea` | `inputId`        | `input-id`        | `string`         | generated    | Overrides the inner textarea id            |
| `qui-textarea` | `placeholder`    | `placeholder`     | `string`         | —            | Placeholder text                           |
| `qui-textarea` | `rows`           | `rows`            | `number`         | `4`          | Visible rows; minimum when `resize="auto"` |
| `qui-textarea` | `resize`         | `resize`          | `TextareaResize` | `"vertical"` | `none`, `vertical`, or `auto`              |
| `qui-textarea` | `maxRows`        | `max-rows`        | `number`         | —            | Maximum rows when `resize="auto"`          |
| `qui-textarea` | `showCount`      | `show-count`      | `boolean`        | `false`      | Shows a character counter                  |
| `qui-textarea` | `maxLength`      | `max-length`      | `number`         | —            | Maximum characters                         |
| `qui-textarea` | `minLength`      | `min-length`      | `number`         | —            | Minimum characters                         |
| `qui-textarea` | `autocomplete`   | `autocomplete`    | `string`         | —            | Autocomplete hint                          |
| `qui-textarea` | `spellcheckHint` | `spellcheck-hint` | `boolean`        | —            | Native spellcheck hint                     |
| `qui-textarea` | `invalid`        | `invalid`         | `boolean`        | `false`      | Marks invalid; ignored inside a field      |
| `qui-textarea` | `disabled`       | `disabled`        | `boolean`        | `false`      | Disables; ignored inside a field           |
| `qui-textarea` | `readOnly`       | `read-only`       | `boolean`        | `false`      | Read-only; ignored inside a field          |
| `qui-textarea` | `required`       | `required`        | `boolean`        | `false`      | Required; ignored inside a field           |

## Events

| Tag            | Event         | Detail              | Description              |
| -------------- | ------------- | ------------------- | ------------------------ |
| `qui-textarea` | `valuechange` | `{ value: string }` | Emitted after every edit |

## Methods

| Tag            | Method                   | Returns           | Description                                 |
| -------------- | ------------------------ | ----------------- | ------------------------------------------- |
| `qui-textarea` | `focusControl(options?)` | `Promise<void>`   | Focuses the native textarea                 |
| `qui-textarea` | `getValue()`             | `Promise<string>` | Current value, including uncontrolled edits |

## Slots

None.

## CSS parts

| Tag            | Part       | Description       |
| -------------- | ---------- | ----------------- |
| `qui-textarea` | `root`     | Field row         |
| `qui-textarea` | `control`  | Control surface   |
| `qui-textarea` | `textarea` | Native textarea   |
| `qui-textarea` | `counter`  | Character counter |

## CSS custom properties

| Property                          | Default                             | Description            |
| --------------------------------- | ----------------------------------- | ---------------------- |
| `--qui-field-container-color`     | `--md-sys-color-surface`            | Control background     |
| `--qui-field-outline-color`       | `--md-sys-color-outline-variant`    | Resting border         |
| `--qui-field-outline-hover-color` | `--md-sys-color-outline`            | Hover border           |
| `--qui-field-text-color`          | `--md-sys-color-on-surface`         | Value and trigger text |
| `--qui-field-placeholder-color`   | `--md-sys-color-on-surface-variant` | Placeholder text       |
| `--qui-field-focus-ring-color`    | `--md-sys-color-primary`            | Focus ring             |
| `--qui-field-focus-border-color`  | `--md-sys-color-primary`            | Border while focused   |
| `--qui-field-error-color`         | `--md-sys-color-error`              | Invalid border         |

These are shared by the field-surface family (`qui-input`, `qui-textarea`,
`qui-select`, `qui-combobox`) and inherit from the host or any ancestor, so a
`qui-field` or a form section can theme all of its controls:

```css
.checkout {
    --qui-field-container-color: #fff;
    --qui-field-outline-color: #006a6a;
    --qui-field-focus-ring-color: #006a6a;
    --qui-field-text-color: #111;
}
```

## Behavior

- `resize` accepts `none`, `vertical` (default), or `auto`.
- Auto-growth uses `rows` as the minimum height and optionally caps growth with
  `max-rows`; if `max-rows` is smaller than `rows`, `rows` stays the minimum.
- `show-count` renders a character counter; with `max-length` it shows
  `current/max`.
- Auto-resize is driven by value changes, input events, resize props, and host
  width changes; renders alone do not trigger measurement.
- Works with `qui-field`; field state overrides local disabled/invalid/required.

## Related

- [`qui-field`](../qui-field/README.md), [`qui-input`](../qui-input/README.md)
