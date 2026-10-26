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
- Keep textarea counter descriptions in sync when the counter is toggled.
- Use ARIA element reflection for cross-shadow-root relationships; IDREF
  fallback remains for same-tree relationships.
