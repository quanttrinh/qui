---
"@quanttrinh/qui": patch
---

Flatten the hydrate build output to `dist/hydrate/` now that the split distribution is gone. The public `@quanttrinh/qui/hydrate` export is unchanged; only the internal `dist` layout and package export paths moved from `dist/hydrate/shared/`.
