---
"@quanttrinh/qui": patch
---

Activate checkable controls from field labels.

Clicking a `qui-field-label` now focuses the registered control and activates
checkable controls, so labels inside a field toggle checkboxes and switches.
Text-like controls and select/combobox triggers are only focused; their menus
are not opened by a label click.
