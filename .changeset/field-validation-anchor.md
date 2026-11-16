---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Compare the form state actually applied to `ElementInternals` instead of caching a string signature, so late validation anchors and native validity changes are always reflected.
- Remove the internal `FormControllerOptions.getSignature` hook. It was not exported from the package entry point.
- Cover field-required checkbox and input controls whose validity anchor appears after the first sync.
