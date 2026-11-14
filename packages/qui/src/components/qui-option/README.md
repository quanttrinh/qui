# `qui-option`

Data-only option used by `qui-select` and `qui-combobox`. It renders its label in
light DOM and provides the value, disabled state, and filter keywords.

## Tags

| Tag          | Summary                                |
| ------------ | -------------------------------------- |
| `qui-option` | Option data source for select/combobox |

## Usage

```html
<qui-select>
    <qui-option value="free">Free</qui-option>
    <qui-option value="pro">Pro</qui-option>
    <qui-option value="enterprise" disabled>Enterprise</qui-option>
</qui-select>
```

## Properties

| Tag          | Property   | Attribute  | Type      | Default      | Description                               |
| ------------ | ---------- | ---------- | --------- | ------------ | ----------------------------------------- |
| `qui-option` | `value`    | `value`    | `string`  | —            | Submitted value (required)                |
| `qui-option` | `disabled` | `disabled` | `boolean` | `false`      | Disables the option                       |
| `qui-option` | `label`    | `label`    | `string`  | slotted text | Explicit label fallback                   |
| `qui-option` | `keywords` | `keywords` | `string`  | —            | Extra text matched by the combobox filter |

## Events

None.

## Methods

None.

## Slots

| Tag          | Slot        | Description  |
| ------------ | ----------- | ------------ |
| `qui-option` | _(default)_ | Option label |

## CSS parts

None.

## CSS custom properties

None.

## Behavior

- `qui-select` and `qui-combobox` read options from their light-DOM children
  through a `MutationObserver`; changing children updates the list.
- For large or remote lists, prefer the parent's `items` property.
- `keywords` is used by the combobox filter for synonyms and aliases.

## Related

- [`qui-select`](../qui-select/README.md), [`qui-combobox`](../qui-combobox/README.md)
