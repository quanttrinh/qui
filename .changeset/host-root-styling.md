---
"@quanttrinh/qui": minor
---

Split host layout from component visual styling.

Host elements now use the document stylesheet only for layout, primarily
`display`. Visual styles live on an internal `part="root"` element owned by the
component shadow root.

```css
qui-card {
  width: 100%;
  margin-block: 2rem;
}

qui-card::part(root) {
  background: white;
  padding: 2rem;
}
```

`qui-icon` exposes its visual box through `::part(icon)`. Tab triggers and
panels use `display: contents` so their internal controls remain the layout
items.
