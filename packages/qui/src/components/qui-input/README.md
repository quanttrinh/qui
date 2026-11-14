# `qui-input`

Single-line, form-associated input with text/tel/search/password/url/number
types, masks, text casing, prefix/suffix slots, number stepping, and password
visibility. Inside `qui-field`, it inherits field ids and state.

## Tags

| Tag         | Summary                           |
| ----------- | --------------------------------- |
| `qui-input` | Form-associated single-line input |

## Usage

```html
<qui-field id="email" required>
    <qui-field-label>Email</qui-field-label>
    <qui-input autocomplete="email" placeholder="you@example.com"></qui-input>
    <qui-field-helper-text>We never share it.</qui-field-helper-text>
</qui-field>

<qui-input input-type="password" value="secret"></qui-input>

<qui-input placeholder="Amount">
    <span slot="prefix">$</span>
    <span slot="suffix">USD</span>
</qui-input>
```

## Properties

| Tag         | Property             | Attribute             | Type                     | Default        | Description                                              |
| ----------- | -------------------- | --------------------- | ------------------------ | -------------- | -------------------------------------------------------- |
| `qui-input` | `inputType`          | `input-type`          | `InputType`              | `"text"`       | `text`, `tel`, `search`, `password`, `url`, or `number`  |
| `qui-input` | `mask`               | `mask`                | `string`                 | —              | Compact text mask (see Behavior)                         |
| `qui-input` | `maskExpression`     | _(property only)_     | `MaskitoOptions["mask"]` | —              | Native Maskito mask; takes precedence over `mask`        |
| `qui-input` | `textCase`           | `text-case`           | `InputTextCase`          | `"none"`       | `none`, `uppercase`, or `lowercase`; ignored for numbers |
| `qui-input` | `autocapitalizeHint` | `autocapitalize-hint` | `InputAutocapitalize`    | derived        | Native `autocapitalize` hint                             |
| `qui-input` | `value`              | `value` (mutable)     | `string \| number`       | —              | Controlled value                                         |
| `qui-input` | `defaultValue`       | `default-value`       | `string \| number`       | —              | Initial value for uncontrolled use                       |
| `qui-input` | `inputId`            | `input-id`            | `string`                 | generated      | Overrides the inner input id                             |
| `qui-input` | `name`               | `name`                | `string`                 | —              | Form field name                                          |
| `qui-input` | `placeholder`        | `placeholder`         | `string`                 | —              | Placeholder text                                         |
| `qui-input` | `autocomplete`       | `autocomplete`        | `string`                 | —              | Autocomplete hint                                        |
| `qui-input` | `keyboardHint`       | `keyboard-hint`       | `InputEnterKeyHint`      | `""`           | Native `enterkeyhint`                                    |
| `qui-input` | `spellcheckHint`     | `spellcheck-hint`     | `boolean`                | —              | Native `spellcheck` hint for text/search                 |
| `qui-input` | `inputModeHint`      | `input-mode-hint`     | `InputMode`              | —              | Native input-mode hint                                   |
| `qui-input` | `numberLocale`       | `number-locale`       | `string`                 | browser locale | Locale used to parse number separators                   |
| `qui-input` | `maxLength`          | `max-length`          | `number`                 | —              | Maximum characters                                       |
| `qui-input` | `minLength`          | `min-length`          | `number`                 | —              | Minimum characters                                       |
| `qui-input` | `inputPattern`       | `input-pattern`       | `string`                 | —              | Native validation pattern                                |
| `qui-input` | `invalid`            | `invalid`             | `boolean`                | `false`        | Marks invalid; ignored inside a field                    |
| `qui-input` | `disabled`           | `disabled`            | `boolean`                | `false`        | Disables; ignored inside a field                         |
| `qui-input` | `readOnly`           | `read-only`           | `boolean`                | `false`        | Read-only; ignored inside a field                        |
| `qui-input` | `required`           | `required`            | `boolean`                | `false`        | Required; ignored inside a field                         |
| `qui-input` | `step`               | `step` (mutable)      | `number \| "any"`        | `1`            | Number step amount or arbitrary values                   |
| `qui-input` | `min`                | `min`                 | `number`                 | —              | Lower bound for stepping/validation                      |
| `qui-input` | `max`                | `max`                 | `number`                 | —              | Upper bound for stepping/validation                      |

## Events

| Tag         | Event         | Detail                                     | Description              |
| ----------- | ------------- | ------------------------------------------ | ------------------------ |
| `qui-input` | `valuechange` | `{ value: string; unmaskedValue: string }` | Emitted after every edit |

## Methods

| Tag         | Method                   | Returns           | Description                                        |
| ----------- | ------------------------ | ----------------- | -------------------------------------------------- |
| `qui-input` | `focusControl(options?)` | `Promise<void>`   | Focuses the native input                           |
| `qui-input` | `getValue()`             | `Promise<string>` | Current native value, including uncontrolled edits |

## Slots

| Tag         | Slot     | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| `qui-input` | `prefix` | Content rendered at the start of the control |
| `qui-input` | `suffix` | Content rendered at the end of the control   |

## CSS parts

| Tag         | Part      | Description     |
| ----------- | --------- | --------------- |
| `qui-input` | `root`    | Field row       |
| `qui-input` | `control` | Control surface |
| `qui-input` | `input`   | Native input    |

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

### Masks

Use `mask` on non-number inputs; literals are inserted automatically.

```html
<qui-input mask="(###) ###-####"></qui-input>
<qui-input mask="AA-####"></qui-input>
<qui-input mask="##/##/####"></qui-input>
```

| Token     | Matches                              |
| --------- | ------------------------------------ |
| `#`       | digit                                |
| `A`       | letter                               |
| `W`       | word character                       |
| `?`       | any character                        |
| `[ ... ]` | character class                      |
| `{n}`     | repeat the previous token            |
| `\`       | display the next character literally |

Backslash always means literal, even for tokens (`\A-####` → `A-1234`).
Variable-width repeats (`*`, `+`, `{n,}`, `{n,m}`) are not supported. For
JavaScript-level masks, set the property-only `maskExpression` to a native
Maskito mask; it takes precedence over `mask`.

### Text case

`text-case` normalizes the value itself (not just appearance) before masking:

```html
<qui-input text-case="uppercase"></qui-input>
<qui-input text-case="lowercase" mask="AA-####"></qui-input>
```

`ab1234` becomes `AB-1234` with the masked example; the display value, unmasked
value, and form submission all use the normalized case. `text-case` is ignored
for number inputs. `autocapitalize` is derived from `text-case`
(`characters`/`none`); override it with `autocapitalize-hint`. For display-only
casing, use CSS instead: `qui-input::part(input) { text-transform: uppercase; }`.

### Number inputs

`input-type="number"` renders a Maskito-managed text input with numeric or
decimal keyboard hints. It accepts digits, an optional leading `-`, and one
decimal separator; commas normalize to `.`, leading zeros are removed. Number
inputs default to `inputmode="numeric"` but still accept decimals — set
`input-mode-hint="numeric"` to reject decimal punctuation. `min`, `max`, and
`step` drive stepping and constraint validation; `step="any"` allows arbitrary
decimals (the stepper still moves by `1`). Parsing uses the browser locale by
default; use `number-locale` to override. Grouping separators are stripped and
the decimal separator normalizes to `.`, so `value`/`valuechange` always use a
dot decimal.

### Native hints

- `keyboard-hint` forwards `enterkeyhint` for every input type.
- `spellcheck-hint` applies to `text` and `search`; presence is `true` in HTML,
  set the property to `false` from JavaScript.
- `input-mode-hint="numeric"` keeps digits and a leading `-` when `min` is unset
  or negative; `"decimal"` keeps digits, `-`, `.`, and `,` under the same rules.
  Masks do not preserve leading signs or decimal separators, so use decimal mode
  without a mask.

## Related

- [`qui-field`](../qui-field/README.md), [`qui-textarea`](../qui-textarea/README.md)
