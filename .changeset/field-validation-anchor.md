---
"@quanttrinh/qui": patch
---

Keep field-required controls focusable when native validation runs.

- Replace the callback-heavy `FormControllerOptions` with a single `FormState` and an optional validity builder. The controller now derives the submit value and default validity from that state.
- Guard `setFormValue()` with `shallowEqual` on the raw value inputs, and always write validity. This keeps the hot path cheap while applying late validation anchors without a string signature.
- Use the submitted value as form restore state: strings restore single values and `FormData` restores multi-value controls.
- Cover field-required checkbox, input, switch, and textarea controls whose validity anchor appears after the first sync.
