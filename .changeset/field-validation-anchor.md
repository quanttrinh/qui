---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Apply the form value and validity on every sync. Both `ElementInternals` calls are idempotent, so late validation anchors and native validity changes need no cache or signature.
- Remove the internal `FormControllerOptions.getSignature` hook. It was not exported from the package entry point.
- Cover field-required checkbox, input, switch, and textarea controls whose validity anchor appears after the first sync.
