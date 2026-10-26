---
"@quanttrinh/qui": minor
---

Add external component stylesheet support and separate theme from shadow-root CSS.

- `Qui.vite({ styles: { href } })` now configures an existing app/component
  stylesheet for shadow roots instead of embedding a blob. Vite marks the
  matching document `<link>` with `data-qui-styles` at build time.
- External styles mode does not import `theme.css` by default. Use
  `styles: { href, theme: true }` when the plugin should load the library theme.
- `theme.css` is now generated directly from the theme source instead of Panda's
  CSS pipeline. It is document-only and contains custom properties plus
  `@property` registrations, with no `:host` fallback or order-only layer
  declarations. Its values stay in the `tokens` layer so app tokens can override
  them normally.
- Generated `styles.css` no longer contains order-only layer declarations, so
  Panda's PostCSS integration does not re-expand the full design system into
  dependency CSS files.
- The published `@quanttrinh/qui/runtime` entry is self-contained and no longer
  imports an unpublished `dist/helpers/dom.js` module.
