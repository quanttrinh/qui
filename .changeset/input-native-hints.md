---
"@quanttrinh/qui": minor
---

Add a `url` input type and `multiple`, `keyboardHint`, and `spellcheckHint`
props, allow `step="any"` for number inputs, default number inputs to
`inputmode="numeric"`, strip non-digit characters when `inputModeHint="numeric"`,
and keep numeric punctuation when `inputModeHint="decimal"`. Remove the `mask`
object prop and `InputMask` type; use `maskPattern` instead.
