---
"@quanttrinh/qui": minor
---

Add per-component color custom properties across the component library:

- `qui-button` — container, label, outline, state-layer, and focus-ring colors.
- Field family (`qui-input`, `qui-textarea`, `qui-select`, `qui-combobox`) — shared `--qui-field-*` properties for container, outline, hover outline, text, placeholder, focus ring, focus border, and error border.
- `qui-field` — label, helper, and error-text colors.
- Option lists (`qui-select`, `qui-combobox`) — listbox, option, highlighted option, selected option, empty state, and indicator colors.
- `qui-checkbox`, `qui-switch`, `qui-radio` — checked, outline, thumb, label, error, and focus-ring colors.
- `qui-tabs` — label, selected label, indicator, list border, panel text, and focus-ring colors.
- `qui-accordion` — container, border, trigger, hover, indicator, content text, and focus-ring colors.
- `qui-dialog` — surface, text, title, description, backdrop, and action colors.
- `qui-card` — container and border colors.
- `qui-popover` — surface and border colors.

Every property falls back to the existing Material theme tokens, so existing themes are unchanged.
