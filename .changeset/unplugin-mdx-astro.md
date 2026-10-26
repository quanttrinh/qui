---
"@quanttrinh/qui": patch
---

Fix unplugin source injection for MDX and Astro.

- Inject the virtual registration import after MDX frontmatter.
- Leave Astro pages untouched; use the explicit registration script for native
  Astro templates.
