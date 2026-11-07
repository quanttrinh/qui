---
"@quanttrinh/qui": minor
---

Replace `qui-input`'s `maskPattern` prop with `mask` and move input editing to `@maskito/core`.

The new mask syntax supports compact `#` digit, `A` letter, `W` word, and `?` any-character tokens, plus `[ ... ]` character classes, fixed `{n}` repetition, and backslash escapes for literals. The regex-style `\d`, `\w`, and `\s` tokens remain available. Variable-width repeats are rejected until dynamic Maskito masks are added. A property-only `maskExpression` prop accepts a native Maskito mask for advanced JavaScript usage and is hidden from HTML attributes. Maskito now also owns text masking, number masking, text-case normalization, numeric/decimal character filtering, caret, paste, delete, undo, composition, controlled-value formatting, change events, and initial calibration.

Number inputs now render as Maskito-managed text inputs instead of native `type="number"` controls. `min`, `max`, and `step` are validated by the component and participate in form constraint validation; `step="any"` still increments by one in the stepper.

Limit `inputType` to Maskito-supported input types plus masked number: `text`, `search`, `tel`, `url`, `password`, and `number`. Remove the unsupported `email` input type and the email-only `multiple` prop.
