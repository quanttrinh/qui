# `qui-icon`

Inline SVG icon rendered from path data. Inherits `font-size` and `color`; no
icon font is required.

## Tags

| Tag        | Summary         |
| ---------- | --------------- |
| `qui-icon` | Inline SVG icon |

## Usage

```html
<qui-icon label="Add" view-box="0 0 24 24" path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>

<qui-button>
    <qui-icon path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
    Add item
</qui-button>
```

Material Symbols paths use `view-box="0 -960 960 960"`.

## Properties

| Tag        | Property  | Attribute  | Type     | Default       | Description                                  |
| ---------- | --------- | ---------- | -------- | ------------- | -------------------------------------------- |
| `qui-icon` | `path`    | `path`     | `string` | —             | SVG path data (`d`). Required                |
| `qui-icon` | `viewBox` | `view-box` | `string` | `"0 0 24 24"` | SVG viewBox                                  |
| `qui-icon` | `label`   | `label`    | `string` | —             | Accessible label; omit for a decorative icon |

## Events

None.

## Methods

None.

## Slots

None.

## CSS parts

| Tag        | Part   | Description        |
| ---------- | ------ | ------------------ |
| `qui-icon` | `icon` | The inner icon box |

## CSS custom properties

None.

## Behavior

- Omit `label` for decorative icons; provide it to expose an accessible name.
- The host uses `display: contents`; style or resize through
  `qui-icon::part(icon)`.
- Any icon element can be used in a `qui-*` slot, so other icon packages work
  too.

## Related

- [`qui-button`](../qui-button/README.md)
