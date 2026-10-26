---
"@quanttrinh/qui": minor
---

Add the `@quanttrinh/qui/runtime` stylesheet helpers.

- `setQuiStylesHref()` configures one or more stylesheet URLs and updates
  existing shadow roots.
- `getQuiStylesHref()` returns the configured URL or the document
  `link[data-qui-styles]` fallback.
- `ensureShadowStylesheet()` adds or reconciles the managed stylesheet link in a
  component shadow root.

Calling `setQuiStylesHref([])` explicitly removes managed links and disables the
document-link fallback. These helpers support dynamically created components and
SSR hydration without duplicating CSS in JavaScript.
