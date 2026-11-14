# `qui-popover`

Renders children in the top layer with the native popover API and positions them
next to an anchor with JavaScript, without CSS anchor positioning.

## Tags

| Tag           | Summary                      |
| ------------- | ---------------------------- |
| `qui-popover` | Controlled top-layer popover |

## Usage

```html
<button type="button" id="menu-button">Menu</button>
<qui-popover anchor="menu-button" placement="bottom-start" open>
    <div role="menu">…</div>
</qui-popover>
```

Without `anchor`, the popover uses its previous element sibling:

```html
<button>Open</button> <qui-popover>…</qui-popover>
```

## Properties

| Tag           | Property              | Attribute                | Type               | Default          | Description                                |
| ------------- | --------------------- | ------------------------ | ------------------ | ---------------- | ------------------------------------------ |
| `qui-popover` | `open`                | `open`                   | `boolean`          | `false`          | Whether the popover is visible             |
| `qui-popover` | `anchor`              | _(property only)_        | `HTMLElement`      | previous sibling | Anchor element                             |
| `qui-popover` | `placement`           | `placement`              | `PopoverPlacement` | `"bottom-start"` | Preferred side and alignment               |
| `qui-popover` | `flip`                | `flip`                   | `boolean`          | `true`           | Flip sides when space runs out             |
| `qui-popover` | `sameWidth`           | `same-width`             | `boolean`          | `false`          | Match the anchor width                     |
| `qui-popover` | `offset`              | `offset`                 | `number`           | `4`              | Gap from the anchor in pixels              |
| `qui-popover` | `padding`             | `padding`                | `number`           | `8`              | Minimum viewport-edge distance             |
| `qui-popover` | `maxHeight`           | `max-height`             | `number`           | available space  | Maximum panel height                       |
| `qui-popover` | `bare`                | `bare`                   | `boolean`          | `false`          | Remove default surface, border, and shadow |
| `qui-popover` | `closeOnOutsideClick` | `close-on-outside-click` | `boolean`          | `true`           | Outside press asks the owner to close      |
| `qui-popover` | `closeOnEscape`       | `close-on-escape`        | `boolean`          | `true`           | Escape asks the owner to close             |

## Events

| Tag           | Event     | Detail                              | Description                               |
| ------------- | --------- | ----------------------------------- | ----------------------------------------- |
| `qui-popover` | `dismiss` | `{ reason: "outside" \| "escape" }` | Requests that the owner close the popover |

## Methods

| Tag           | Method         | Returns         | Description                                       |
| ------------- | -------------- | --------------- | ------------------------------------------------- |
| `qui-popover` | `reposition()` | `Promise<void>` | Repositions an open popover after content changes |

## Slots

| Tag           | Slot        | Description     |
| ------------- | ----------- | --------------- |
| `qui-popover` | _(default)_ | Popover content |

## CSS parts

| Tag           | Part      | Description      |
| ------------- | --------- | ---------------- |
| `qui-popover` | `content` | Positioned panel |

## CSS custom properties

| Property                      | Default                          | Description      |
| ----------------------------- | -------------------------------- | ---------------- |
| `--qui-popover-surface-color` | `--md-sys-color-surface`         | Panel background |
| `--qui-popover-border-color`  | `--md-sys-color-outline-variant` | Panel border     |

## Behavior

- The popover is controlled: it never closes itself. Listen for `dismiss` and set
  `open` to `false`.
- Positioning re-runs on open, scroll, resize, and panel resize; positioning
  props only schedule a reposition without re-rendering the template.
- `anchor` is property-only and normally unnecessary because the previous
  sibling is used.

## Related

- [`qui-dialog`](../qui-dialog/README.md), [`qui-select`](../qui-select/README.md),
  [`qui-combobox`](../qui-combobox/README.md)
