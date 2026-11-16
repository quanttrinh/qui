---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Guard `setFormValue()` with `shallowEqual` on the raw value inputs, and always write validity. This keeps the hot path cheap while applying late validation anchors without a string signature.
- Remove the internal `FormControllerOptions.getSignature` hook. It was not exported from the package entry point.
- Cover field-required checkbox, input, switch, and textarea controls whose validity anchor appears after the first sync.
