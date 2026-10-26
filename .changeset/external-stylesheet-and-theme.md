---
"@quanttrinh/qui": minor
---

Add external component stylesheet support and separate theme from shadow-root CSS.

- `Qui.vite({ styles: { href } })` now uses an existing app/component
  stylesheet instead of embedding a blob. Vite marks a document `<link>` whose
  href matches the configured stable URL. Marked document links are the runtime
  source of truth, so hashed or `base`-prefixed asset URLs are preserved without
  a client-side fallback.
- External styles mode does not import `theme.css` by default. Use
  `styles: { href, theme: true }` when the plugin should load the library theme.
- `theme.css` is now generated directly from the theme source instead of Panda's
  CSS pipeline. It is document-only and contains custom properties plus
  `@property` registrations, with no `:host` fallback. Individual layer
  declarations establish canonical layer order without triggering Panda's
  full-order PostCSS expansion.
- Generated `styles.css` removes the root layer order declaration that triggers
  Panda's PostCSS integration, while preserving nested recipe layer
  declarations and their precedence.
- The published `@quanttrinh/qui/runtime` entry is self-contained and no longer
  imports an unpublished `dist/helpers/dom.js` module.
