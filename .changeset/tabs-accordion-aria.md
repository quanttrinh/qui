---
"@quanttrinh/qui": patch
---

Harden tabs and accordion ARIA and keyboard behavior.

- Clear stale `aria-controls` and `aria-labelledby` relationships when related
  parts are removed.
- Order roving focus by document position instead of registration order.
- Avoid redundant blur updates when focus moves between triggers.
- Account for focusable descendants inside nested shadow roots before adding a
  tab panel to the tab order.
- Defer panel tab-stop recalculation until after render to avoid Stencil
  state-during-render warnings.
