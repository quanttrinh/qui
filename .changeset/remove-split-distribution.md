---
"@quanttrinh/qui": minor
---

Remove the split CSS distribution.

The package now ships a single shared component stylesheet. The `split`
component entry points, `hydrate/split`, `base.css`, `split.css`, per-component
split CSS, and the unplugin `strategy` option are removed.

Consumers should use `@quanttrinh/qui/shared/*`, `@quanttrinh/qui/hydrate`,
`theme.css`, and `styles.css`.
