---
"@quanttrinh/qui": patch
---

Fix unplugin source injection for MDX and Astro.

- Inject the virtual registration import after MDX frontmatter, including empty,
  CRLF, trailing-whitespace, and end-of-file frontmatter blocks.
- Leave Astro pages untouched; use the explicit registration script for native
  Astro templates.
