# `qui-button`

MD3 button with filled, tonal, elevated, outlined, and text variants. Renders an
anchor when `href` is set; otherwise a native `<button>`.

## Tags

| Tag          | Summary              |
| ------------ | -------------------- |
| `qui-button` | MD3 button or anchor |

## Usage

```html
<qui-button variant="filled">Save</qui-button>
<qui-button variant="outlined" href="/docs" target="_blank">Docs</qui-button>
<qui-button icon-only label="Add">
    <qui-icon path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
</qui-button>
```

## Properties

| Tag          | Property   | Attribute   | Type                              | Default    | Description                                                     |
| ------------ | ---------- | ----------- | --------------------------------- | ---------- | --------------------------------------------------------------- |
| `qui-button` | `variant`  | `variant`   | `ButtonVariant`                   | `"filled"` | Visual style: `filled`, `tonal`, `elevated`, `outlined`, `text` |
| `qui-button` | `size`     | `size`      | `ButtonSize`                      | `"md"`     | Control size: `sm`, `md`, `lg`                                  |
| `qui-button` | `iconOnly` | `icon-only` | `boolean`                         | `false`    | Renders a square button sized for a single icon                 |
| `qui-button` | `label`    | `label`     | `string`                          | —          | Accessible name, primarily for icon-only buttons                |
| `qui-button` | `disabled` | `disabled`  | `boolean`                         | `false`    | Disables the control                                            |
| `qui-button` | `href`     | `href`      | `string`                          | —          | Renders an anchor instead of a button                           |
| `qui-button` | `target`   | `target`    | `string`                          | —          | Anchor target                                                   |
| `qui-button` | `rel`      | `rel`       | `string`                          | —          | Anchor relationship                                             |
| `qui-button` | `download` | `download`  | `string`                          | —          | Anchor download hint                                            |
| `qui-button` | `type`     | `type`      | `"button" \| "submit" \| "reset"` | `"button"` | Native button type                                              |

## Events

None.

## Methods

None.

## Slots

| Tag          | Slot        | Description                  |
| ------------ | ----------- | ---------------------------- |
| `qui-button` | _(default)_ | Button label or icon content |

## CSS parts

| Tag          | Part     | Description                   |
| ------------ | -------- | ----------------------------- |
| `qui-button` | `button` | The internal button or anchor |

## CSS custom properties

| Property                         | Default                  | Description                       |
| -------------------------------- | ------------------------ | --------------------------------- |
| `--qui-button-container-color`   | variant-dependent        | Background color                  |
| `--qui-button-label-color`       | variant-dependent        | Text and icon color               |
| `--qui-button-outline-color`     | `--md-sys-color-outline` | Border color for outlined buttons |
| `--qui-button-state-layer-color` | `currentColor`           | Hover/active/focus overlay tint   |
| `--qui-button-focus-ring-color`  | `--md-sys-color-primary` | Focus ring color                  |

Variant defaults:

| Variant    | Container                              | Label                                   |
| ---------- | -------------------------------------- | --------------------------------------- |
| `filled`   | `--md-sys-color-primary`               | `--md-sys-color-on-primary`             |
| `tonal`    | `--md-sys-color-secondary-container`   | `--md-sys-color-on-secondary-container` |
| `elevated` | `--md-sys-color-surface-container-low` | `--md-sys-color-primary`                |
| `outlined` | `transparent`                          | `--md-sys-color-primary`                |
| `text`     | `transparent`                          | `--md-sys-color-primary`                |

Set the properties on the host or an ancestor:

```css
qui-button.danger {
    --qui-button-container-color: #b3261e;
    --qui-button-label-color: #fff;
    --qui-button-state-layer-color: #fff;
}
```

Because the properties inherit, a container can theme all of its buttons:

```css
.checkout {
    --qui-button-container-color: #006a6a;
    --qui-button-label-color: #fff;
}
```

### Using Panda tokens

In plain CSS, use the emitted CSS variables. Material theme tokens are defined by
`theme.css` on `:root` and are the safest values for a parent stylesheet:

```css
.checkout {
    --qui-button-container-color: var(--md-sys-color-primary);
    --qui-button-label-color: var(--md-sys-color-on-primary);
}
```

Token keys such as `colors.primary` are a Panda JavaScript API, not valid CSS
values; a custom property set to a bare token key cannot be resolved by the
browser. In JavaScript or TypeScript, resolve them with the package token helper:

```ts
import { token } from "@quanttrinh/qui/tokens";

element.style.setProperty("--qui-button-container-color", token("colors.primary"));
element.style.setProperty("--qui-button-label-color", token("colors.onPrimary"));
```

`token("colors.primary")` resolves to `var(--md-sys-color-primary)`, while
palette tokens such as `token("colors.red.600")` resolve to their raw color
value.

For app-wide colors, prefer overriding the Material tokens on `:root` or a
themed subtree (`--md-sys-color-primary`, `--md-sys-color-on-primary`, …).
`::part(button)` also works for direct declarations, but attribute selectors
after `::part()` (e.g. `::part(button)[data-variant="tonal"]`) are not matched.

## Behavior

- Use `icon-only` with `label` for accessible icon buttons.
- Anchor mode keeps button styling but drops the default underline and inherits
  the host font.
- Disabled anchors get `aria-disabled` and are not activatable.

## Related

- [`qui-icon`](../qui-icon/README.md)
