---
"@quanttrinh/qui": minor
---

Add a `url` input type and `multiple`, `keyboardHint`, and `spellcheckHint`
props, allow `step="any"` for number inputs, strip non-digit characters when
`inputModeHint="numeric"`, and allow a leading minus sign plus one decimal
separator when `inputModeHint="decimal"`. Remove the `mask` object prop and
`InputMask` type; use `maskPattern` instead.
