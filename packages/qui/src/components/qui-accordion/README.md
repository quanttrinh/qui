# `qui-accordion`

MD3 accordion composed from an accordion root, item, trigger, and content.

## Tags

| Tag                     | Summary                                     |
| ----------------------- | ------------------------------------------- |
| `qui-accordion`         | Root: expanded values and configuration     |
| `qui-accordion-item`    | One item; owns its value and disabled state |
| `qui-accordion-trigger` | Button that toggles the item                |
| `qui-accordion-content` | Collapsible content region                  |

## Usage

```html
<qui-accordion multiple>
    <qui-accordion-item value="shipping">
        <qui-accordion-trigger>Shipping</qui-accordion-trigger>
        <qui-accordion-content>Ships in 2–3 business days.</qui-accordion-content>
    </qui-accordion-item>
    <qui-accordion-item value="returns">
        <qui-accordion-trigger>Returns</qui-accordion-trigger>
        <qui-accordion-content>30-day return window.</qui-accordion-content>
    </qui-accordion-item>
</qui-accordion>
```

## Properties

| Tag                  | Property        | Attribute         | Type                         | Default      | Description                                |
| -------------------- | --------------- | ----------------- | ---------------------------- | ------------ | ------------------------------------------ |
| `qui-accordion`      | `multiple`      | `multiple`        | `boolean`                    | `false`      | Allow several items open                   |
| `qui-accordion`      | `collapsible`   | `collapsible`     | `boolean`                    | `false`      | Allow closing the open item in single mode |
| `qui-accordion`      | `value`         | _(property only)_ | `string[]`                   | —            | Controlled expanded values                 |
| `qui-accordion`      | `defaultValue`  | _(property only)_ | `string[]`                   | —            | Initial expanded values                    |
| `qui-accordion`      | `disabled`      | `disabled`        | `boolean`                    | `false`      | Disables every item                        |
| `qui-accordion`      | `orientation`   | `orientation`     | `"horizontal" \| "vertical"` | `"vertical"` | Layout orientation                         |
| `qui-accordion`      | `textDirection` | `text-direction`  | `"ltr" \| "rtl"`             | —            | Text direction                             |
| `qui-accordion-item` | `value`         | `value`           | `string`                     | —            | Item identifier (required)                 |
| `qui-accordion-item` | `disabled`      | `disabled`        | `boolean`                    | `false`      | Disables this item                         |

## Events

| Tag             | Event         | Detail                | Description                             |
| --------------- | ------------- | --------------------- | --------------------------------------- |
| `qui-accordion` | `valuechange` | `{ value: string[] }` | Emitted whenever expanded values change |

## Methods

None.

## Slots

| Tag                     | Slot        | Description           |
| ----------------------- | ----------- | --------------------- |
| `qui-accordion`         | _(default)_ | Accordion items       |
| `qui-accordion-item`    | _(default)_ | A trigger and content |
| `qui-accordion-trigger` | _(default)_ | Trigger label         |
| `qui-accordion-content` | _(default)_ | Body content          |

## CSS parts

| Tag                     | Part        | Description               |
| ----------------------- | ----------- | ------------------------- |
| `qui-accordion`         | `root`      | Accordion container       |
| `qui-accordion-item`    | `item`      | Item wrapper              |
| `qui-accordion-trigger` | `trigger`   | Internal button           |
| `qui-accordion-trigger` | `indicator` | Expand/collapse indicator |
| `qui-accordion-content` | `content`   | Content region            |

## CSS custom properties

| Property                              | Default                                 | Description              |
| ------------------------------------- | --------------------------------------- | ------------------------ |
| `--qui-accordion-container-color`     | `--md-sys-color-surface`                | Root background          |
| `--qui-accordion-border-color`        | `--md-sys-color-outline-variant`        | Root and item dividers   |
| `--qui-accordion-trigger-color`       | `--md-sys-color-on-surface`             | Trigger label            |
| `--qui-accordion-trigger-hover-color` | `--md-sys-color-surface-container-high` | Trigger hover background |
| `--qui-accordion-indicator-color`     | `--md-sys-color-on-surface-variant`     | Expand indicator         |
| `--qui-accordion-content-text-color`  | `--md-sys-color-on-surface-variant`     | Content text             |
| `--qui-accordion-focus-ring-color`    | `--md-sys-color-primary`                | Focus ring               |

## Behavior

- Single mode replaces the expanded value; multiple mode adds/removes.
- Closing the only open item requires `collapsible` in single mode.
- `value` and `defaultValue` are property-only arrays.
- Arrow, Home, and End keys move focus between triggers within one accordion.
- ARIA (`aria-expanded`, `aria-controls`, `aria-labelledby`) is wired across
  shadow roots; collapsed content uses `inert`.
- Root template only reads props, so controller updates notify children without
  re-rendering the root.

## Related

- [`AccordionController`](./controller.md)
