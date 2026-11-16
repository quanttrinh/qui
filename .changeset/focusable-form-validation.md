---
"@quanttrinh/qui": patch
---

Keep form-associated checkable controls focusable during native constraint validation.

- Use a shared invisible input overlay for checkbox, switch, and radio controls instead of clipping the native input to a 1px box. The overlay ignores pointer events so the visual control keeps its hover and cursor behavior.
- Report the selected or first enabled native radio input as the radio group validation anchor, and refresh validity when radios register, unregister, or change disabled state.
- Document that every form control's validation element must be focusable for `form.reportValidity()`.
