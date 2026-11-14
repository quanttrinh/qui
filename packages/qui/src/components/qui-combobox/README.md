# `qui-combobox`

MD3 combobox with a text query, debounced filtering, and the same measured
virtualized list as `qui-select`. Options come from `qui-option` children or the
`items` property.

## Tags

| Tag            | Summary                             |
| -------------- | ----------------------------------- |
| `qui-combobox` | Form-associated filterable combobox |

## Usage

```html
<qui-combobox placeholder="Search frameworks">
    <qui-option value="react">React</qui-option>
    <qui-option value="solid">Solid</qui-option>
    <qui-option value="vue">Vue</qui-option>
</qui-combobox>
```

```ts
const combo = document.querySelector("qui-combobox");
combo.items = [
    { value: "react", label: "React", disabled: false, keywords: "jsx hooks" },
    { value: "solid", label: "Solid", disabled: false },
];
```

## Properties

| Tag            | Property            | Attribute             | Type                 | Default        | Description                                      |
| -------------- | ------------------- | --------------------- | -------------------- | -------------- | ------------------------------------------------ |
| `qui-combobox` | `items`             | _(property only)_     | `OptionItem[]`       | —              | Options as data; overrides `qui-option` children |
| `qui-combobox` | `optionRender`      | _(property only)_     | `OptionRender`       | —              | Replaces option row content                      |
| `qui-combobox` | `value`             | _(property only)_     | `string[]`           | —              | Controlled selected values                       |
| `qui-combobox` | `defaultValue`      | _(property only)_     | `string[]`           | —              | Initial selected values                          |
| `qui-combobox` | `name`              | `name`                | `string`             | —              | Form field name                                  |
| `qui-combobox` | `disabled`          | `disabled`            | `boolean`            | `false`        | Disables the control                             |
| `qui-combobox` | `invalid`           | `invalid`             | `boolean`            | `false`        | Marks invalid                                    |
| `qui-combobox` | `readOnly`          | `read-only`           | `boolean`            | `false`        | Makes read-only                                  |
| `qui-combobox` | `required`          | `required`            | `boolean`            | `false`        | Marks required                                   |
| `qui-combobox` | `multiple`          | `multiple`            | `boolean`            | `false`        | Allows multiple selected values                  |
| `qui-combobox` | `closeOnSelect`     | `close-on-select`     | `boolean`            | `true`         | Close the list after selecting                   |
| `qui-combobox` | `open`              | `open`                | `boolean`            | —              | Controlled open state                            |
| `qui-combobox` | `defaultOpen`       | `default-open`        | `boolean`            | `false`        | Initial open state                               |
| `qui-combobox` | `textDirection`     | `text-direction`      | `"ltr" \| "rtl"`     | —              | Text direction                                   |
| `qui-combobox` | `overscan`          | `overscan`            | `number`             | `6`            | Extra rows above/below the window                |
| `qui-combobox` | `estimateSize`      | `estimate-size`       | `number`             | `40`           | Initial row-height estimate                      |
| `qui-combobox` | `inputValue`        | `input-value`         | `string`             | —              | Controlled input text                            |
| `qui-combobox` | `defaultInputValue` | `default-input-value` | `string`             | `""`           | Initial input text                               |
| `qui-combobox` | `placeholder`       | `placeholder`         | `string`             | —              | Placeholder text                                 |
| `qui-combobox` | `openOnClick`       | `open-on-click`       | `boolean`            | `false`        | Clicking the input opens the list                |
| `qui-combobox` | `openOnChange`      | `open-on-change`      | `boolean`            | `true`         | Typing opens the list                            |
| `qui-combobox` | `allowCustomValue`  | `allow-custom-value`  | `boolean`            | `false`        | Commit custom input as a selection               |
| `qui-combobox` | `loopFocus`         | `loop-focus`          | `boolean`            | `true`         | Wrap keyboard navigation                         |
| `qui-combobox` | `filter`            | _(property only)_     | `ComboboxFilter`     | —              | Custom matcher; property-only                    |
| `qui-combobox` | `filterMode`        | `filter-mode`         | `ComboboxFilterMode` | `"contains"`   | Built-in matching strategy; `none` to skip       |
| `qui-combobox` | `filterDebounce`    | `filter-debounce`     | `number`             | `0`            | Query debounce in milliseconds                   |
| `qui-combobox` | `loading`           | `loading`             | `boolean`            | `false`        | Shows the loading state                          |
| `qui-combobox` | `emptyText`         | `empty-text`          | `string`             | `"No results"` | Message when no option matches                   |
| `qui-combobox` | `loadingText`       | `loading-text`        | `string`             | `"Loading…"`   | Message while loading                            |

## Events

| Tag            | Event              | Detail                                         | Description             |
| -------------- | ------------------ | ---------------------------------------------- | ----------------------- |
| `qui-combobox` | `valuechange`      | `{ value: string[]; items: ComboboxOption[] }` | Selected values changed |
| `qui-combobox` | `inputvaluechange` | `{ inputValue: string; reason: string }`       | Input text changed      |
| `qui-combobox` | `openchange`       | `{ open: boolean; reason: string }`            | List opened or closed   |

## Methods

| Tag            | Method                   | Returns             | Description                                       |
| -------------- | ------------------------ | ------------------- | ------------------------------------------------- |
| `qui-combobox` | `focusControl(options?)` | `Promise<void>`     | Focuses the internal input                        |
| `qui-combobox` | `getValue()`             | `Promise<string[]>` | Current selection, including uncontrolled changes |

## Slots

| Tag            | Slot        | Description           |
| -------------- | ----------- | --------------------- |
| `qui-combobox` | _(default)_ | `qui-option` children |

## CSS parts

| Tag            | Part               | Description               |
| -------------- | ------------------ | ------------------------- |
| `qui-combobox` | `root`             | Control root              |
| `qui-combobox` | `control`          | Control surface           |
| `qui-combobox` | `input`            | Text input                |
| `qui-combobox` | `trigger`          | Open/close button         |
| `qui-combobox` | `loading`          | Loading message           |
| `qui-combobox` | `empty`            | Empty-state message       |
| `qui-combobox` | `listbox`          | Option list               |
| `qui-combobox` | `viewport`         | Scrolling viewport        |
| `qui-combobox` | `option`           | Option row                |
| `qui-combobox` | `option-text`      | Option label              |
| `qui-combobox` | `option-indicator` | Selected-option indicator |

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
- Filtering uses `filter` when set, otherwise `filterMode`; use `"none"` when
  `items` is already filtered server-side.
- `filter-debounce` delays query application; `loading`/`empty-text` drive the
  list state messages.
- `allow-custom-value` commits typed text that is not an option as a selection.
- `input-value` controls the text; the query updates from it without replacing
  the user's typed text.
- `value` and `defaultValue` are property-only string arrays.
- Rows are measured and virtualized; the list is positioned in the top layer
  with `popover="manual"`.

## Related

- [`qui-option`](../qui-option/README.md), [`qui-select`](../qui-select/README.md),
  [`qui-field`](../qui-field/README.md)
- [`ComboboxInputController`](./input-controller.md)
- [`Option controllers`](../shared/controllers/option/README.md)
