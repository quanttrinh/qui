---
"@quanttrinh/qui": minor
---

Render `qui-icon` from inline SVG instead of the Material Symbols font.

`qui-icon` now accepts `path` and `viewBox` instead of `name`:

```html
<qui-icon
  view-box="0 0 24 24"
  path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"
></qui-icon>
```

The Material Symbols font is no longer required. `viewBox` defaults to
`0 0 24 24`; Material Symbols paths can use `view-box="0 -960 960 960"`.
