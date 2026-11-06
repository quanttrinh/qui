---
"@quanttrinh/qui": minor
---

Replace `qui-input`'s `maskPattern` prop with `mask` and move non-number input editing to `@maskito/core`.

The new mask syntax uses `\d`, `\w`, and `\s` matching tokens, `[ ... ]` character classes, fixed `{n}` repetition, and backslash escapes for literals. Variable-width quantifiers are rejected until dynamic Maskito masks are added. Maskito now also owns text-case normalization, numeric/decimal character filtering, caret, paste, delete, undo, composition, controlled-value formatting, change events, and initial calibration for non-number inputs. Numeric min/max/step behavior remains native.

Limit `inputType` to Maskito-supported input types plus native number: `text`, `search`, `tel`, `url`, `password`, and `number`. Remove the unsupported `email` input type and the email-only `multiple` prop.
