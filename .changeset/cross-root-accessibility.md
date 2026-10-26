---
"@quanttrinh/qui": minor
---

Improve cross-shadow-root accessibility wiring.

- Target host elements for ARIA relationships instead of internal elements in
  sibling shadow roots.
- Add shared context registries so field, accordion, tabs, dialog, and radio
  parts reconnect correctly after upgrades or re-renders.
- Wire dialog titles/descriptions and tab/accordion trigger/content
  relationships across shadow boundaries.
- Clear stale ARIA relationships when a related part is removed.
- Support both ARIA element reflection and IDREF fallback paths.
