---
"@quanttrinh/qui-unplugin": patch
---

Register internal composite component dependencies automatically. `qui-select` and `qui-combobox` now also register their internal `qui-popover`, so dropdowns work without extra consumer registration.
