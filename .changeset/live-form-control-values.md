---
"@quanttrinh/qui": minor
---

Add public live-value getters for form controls: `getValue()` on input, textarea, select, combobox, and radio groups, plus `getChecked()` on checkbox and switch. These return the current uncontrolled or controlled value so consumers no longer need to inspect shadow DOM internals.
