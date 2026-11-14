---
"@quanttrinh/qui": minor
---

Add a `@quanttrinh/qui/theme` entry point with an `applyTheme()` helper and the existing runtime color helpers.

`applyTheme({ source, variant, contrast, dark }, target?)` derives a Material scheme, writes every `--md-sys-color-*` property, and returns the resolved colors for reuse.
