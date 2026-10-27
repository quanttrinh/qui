---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": minor
---

Split the bundler plugin into `@quanttrinh/qui-unplugin`, add external component stylesheet support, separate the document-only theme from shadow-root CSS, and flatten the hydrate output.

- Add `Qui.vite({ styles: { href } })` for an existing app/component stylesheet without a blob URL. Vite marks a matching document link and applies its configured base. External mode is Vite-only and uses marked document links as the source of truth.
- External styles do not import `theme.css` by default. Use `styles: { href, theme: true }` when the plugin should load the library theme.
- Generate `theme.css` directly from the theme source. It is document-only, contains custom properties and `@property` registrations, has no `:host` fallback, and establishes canonical layer order.
- Replace the root layer order declaration in generated `styles.css` with individual declarations so Panda does not re-expand dependency CSS.
- Move the plugin to `packages/unplugin` as `@quanttrinh/qui-unplugin` with a compatible main-package peer range (`>=0.3.1 <0.5.0`). `@quanttrinh/qui/unplugin` is removed; install the plugin package and import it directly.
- Move `@quanttrinh/qui` into `packages/qui` and make the repository root a private workspace.
- Flatten the hydrate build output to `dist/hydrate/`.
- Make the published runtime self-contained by inlining the DOM element check.

This repository treats a minor release of a `0.x` package as the breaking-change signal.
