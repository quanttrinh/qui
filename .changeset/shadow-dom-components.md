---
"@quanttrinh/qui": minor
---

Migrate all components to Shadow DOM.

Every `qui-*` component now renders into an open shadow root. Internal DOM is
no longer part of the light DOM, so consumers must use public `part` hooks or
the component API instead of querying internal elements.

- Remove the `innerClass` escape hatch. Use `::part(...)`, design tokens, or
  public props for customization.
- Add missing `part="root"` hooks to card, input, and textarea.
- Replace light-DOM internals in tests and examples with shadow-aware queries.
