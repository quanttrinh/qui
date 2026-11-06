---
"@quanttrinh/qui": minor
---

Replace `qui-input`'s `maskPattern` prop with `mask` and move text masking to `@maskito/core`.

The new mask syntax uses `\d`, `\w`, and `\s` matching tokens, `[ ... ]` character classes, fixed `{n}` repetition, and backslash escapes for literals. Variable-width quantifiers are rejected until dynamic Maskito masks are added. Masking applies to non-number inputs; numeric min/max/step behavior remains native.
