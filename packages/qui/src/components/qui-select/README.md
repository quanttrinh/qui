# `qui-select`

MD3 select backed by a native popover with measured, virtualized option rows.
Options come from `qui-option` children or the `items` property.

## Tags

| Tag          | Summary                |
| ------------ | ---------------------- |
| `qui-select` | Form-associated select |

## Usage

```html
<qui-select placeholder="Choose a plan">
    <qui-option value="free">Free</qui-option>
    <qui-option value="pro">Pro</qui-option>
    <qui-option value="business">Business</qui-option>
</qui-select>
```

```ts
const select = document.querySelector("qui-select");
select.items = [
    { value: "free", label: "Free", disabled: false },
    { value: "pro", label: "Pro", disabled: false },
];
```

## Properties

| Tag          | Property        | Attribute         | Type             | Default              | Description                                      |
| ------------ | --------------- | ----------------- | ---------------- | -------------------- | ------------------------------------------------ |
| `qui-select` | `items`         | _(property only)_ | `OptionItem[]`   | —                    | Options as data; overrides `qui-option` children |
| `qui-select` | `optionRender`  | _(property only)_ | `OptionRender`   | —                    | Replaces option row content                      |
| `qui-select` | `value`         | _(property only)_ | `string[]`       | —                    | Controlled selected values                       |
| `qui-select` | `defaultValue`  | _(property only)_ | `string[]`       | —                    | Initial selected values                          |
| `qui-select` | `name`          | `name`            | `string`         | —                    | Form field name                                  |
| `qui-select` | `disabled`      | `disabled`        | `boolean`        | `false`              | Disables the control                             |
| `qui-select` | `invalid`       | `invalid`         | `boolean`        | `false`              | Marks invalid                                    |
| `qui-select` | `readOnly`      | `read-only`       | `boolean`        | `false`              | Makes read-only                                  |
| `qui-select` | `required`      | `required`        | `boolean`        | `false`              | Marks required                                   |
| `qui-select` | `multiple`      | `multiple`        | `boolean`        | `false`              | Allows multiple selected values                  |
| `qui-select` | `closeOnSelect` | `close-on-select` | `boolean`        | `true`               | Close the list after selecting                   |
| `qui-select` | `open`          | `open`            | `boolean`        | —                    | Controlled open state                            |
| `qui-select` | `defaultOpen`   | `default-open`    | `boolean`        | `false`              | Initial open state                               |
| `qui-select` | `textDirection` | `text-direction`  | `"ltr" \| "rtl"` | —                    | Text direction                                   |
| `qui-select` | `overscan`      | `overscan`        | `number`         | `6`                  | Extra rows above/below the window                |
| `qui-select` | `estimateSize`  | `estimate-size`   | `number`         | `40`                 | Initial row-height estimate                      |
| `qui-select` | `placeholder`   | `placeholder`     | `string`         | `"Select an option"` | Trigger text when empty                          |
| `qui-select` | `loopFocus`     | `loop-focus`      | `boolean`        | `false`              | Wrap keyboard navigation                         |
| `qui-select` | `deselectable`  | `deselectable`    | `boolean`        | `false`              | Selecting the current value clears it            |
| `qui-select` | `emptyText`     | `empty-text`      | `string`         | `"No options"`       | Message when there are no options                |

## Events

| Tag          | Event         | Detail                                       | Description                               |
| ------------ | ------------- | -------------------------------------------- | ----------------------------------------- |
| `qui-select` | `valuechange` | `{ value: string[]; items: SelectOption[] }` | Emitted whenever the selection changes    |
| `qui-select` | `openchange`  | `{ open: boolean; reason: string }`          | Emitted whenever the list opens or closes |

## Methods

| Tag          | Method                   | Returns             | Description                                       |
| ------------ | ------------------------ | ------------------- | ------------------------------------------------- |
| `qui-select` | `focusControl(options?)` | `Promise<void>`     | Focuses the internal trigger                      |
| `qui-select` | `getValue()`             | `Promise<string[]>` | Current selection, including uncontrolled changes |

## Slots

| Tag          | Slot        | Description           |
| ------------ | ----------- | --------------------- |
| `qui-select` | _(default)_ | `qui-option` children |

## CSS parts

| Tag          | Part               | Description                               |
| ------------ | ------------------ | ----------------------------------------- |
| `qui-select` | `root`             | Control root                              |
| `qui-select` | `control`          | Control surface                           |
| `qui-select` | `trigger`          | Trigger button                            |
| `qui-select` | `value-text`       | Selected value text                       |
| `qui-select` | `indicator`        | Dropdown indicator                        |
| `qui-select` | `empty`            | Empty-state message                       |
| `qui-select` | `listbox`          | Option list                               |
| `qui-select` | `viewport`         | Scrolling viewport (shared with combobox) |
| `qui-select` | `option`           | Option row                                |
| `qui-select` | `option-text`      | Option label                              |
| `qui-select` | `option-indicator` | Selected-option indicator                 |

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

### Option list

| Property                                       | Default                                    | Description                   |
| ---------------------------------------------- | ------------------------------------------ | ----------------------------- |
| `--qui-option-list-container-color`            | `--md-sys-color-surface`                   | Listbox background            |
| `--qui-option-list-border-color`               | `--md-sys-color-outline-variant`           | Listbox border                |
| `--qui-option-list-empty-color`                | `--md-sys-color-on-surface-variant`        | Empty/loading text            |
| `--qui-option-list-option-color`               | `--md-sys-color-on-surface`                | Option text                   |
| `--qui-option-list-option-hover-color`         | `--md-sys-color-surface-container-highest` | Highlighted option background |
| `--qui-option-list-option-selected-color`      | `--md-sys-color-secondary-container`       | Selected option background    |
| `--qui-option-list-option-selected-text-color` | `--md-sys-color-on-secondary-container`    | Selected option text          |
| `--qui-option-list-indicator-color`            | `--md-sys-color-primary`                   | Selected check indicator      |

## Behavior

- Options come from light-DOM `qui-option` children (observed) or `items`.
  Property items are not copied and take precedence.
- Rows are measured and virtualized; `overscan` and `estimate-size` tune the
  window.
- `value` and `defaultValue` are property-only string arrays.
- Disabled options cannot be selected; `deselectable` clears a single selection.
- `closeOnSelect` and `open` provide controlled open behavior.
- The list renders in the top layer with `popover="manual"` and is positioned
  with JavaScript.

## Related

- [`qui-option`](../qui-option/README.md), [`qui-combobox`](../qui-combobox/README.md),
  [`qui-field`](../qui-field/README.md)
- [`Option controllers`](../shared/controllers/option/README.md)
