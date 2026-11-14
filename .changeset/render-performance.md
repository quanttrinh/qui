---
"@quanttrinh/qui": patch
---

Improve rendering performance across the component library:

- Scope context notifications to the values that changed, so accordion items, tabs, and radio groups only re-render affected parts.
- Notify context subscribers without re-rendering prop-only container components.
- Skip renders for props that only feed child context, native form state, positioning, or platform APIs.
- Cache repeated ARIA relationship writes and tab-stop checks.
- Avoid redundant auto-resize work and controller-driven registration renders.
