---
"@quanttrinh/qui": patch
---

Align inline icon SVGs with Material Symbols Rounded.

- Replace the classic Material Icons paths for `check`, `remove`, `add`,
  `visibility`, `expand_more`, and `unfold_more` with the official Material
  Symbols Rounded geometry.
- Update `visibility_off` to the current Google Fonts rounded path.
- Render every inline icon from the shared `0 -960 960 960` Material Symbols
  canvas so they visually match the `qui-icon` font.
