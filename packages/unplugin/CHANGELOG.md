# @quanttrinh/qui-unplugin

## 0.2.0

### Minor Changes

- 77e024e: Resolve and mark content-hashed component stylesheets, including SSR output.
  
  - Allow `styles.href` to be an async resolver that receives the Vite command, mode, base, HTML path, and build bundle, so content-hashed CSS assets can be marked without hard-coding the hash. The resolver context correctly distinguishes client and SSR builds.
  - Export `resolveStylesheetHrefs` and `markExternalStylesheetLinks` for SSR/SSG pipelines that render HTML outside Vite's `transformIndexHtml`. Resolved URLs include the Vite base, and the public helper validates malformed styles.
  - Cache the normalized configured stylesheet href list, query only `link[data-qui-styles]`, and ignore unrelated link mutations when invalidating discovered stylesheet URLs.
  - Export the `data-qui-styles` attribute and link selector from the runtime so SSR and test helpers share one definition instead of duplicating constants.
  - Widen the plugin peer range to `>=0.4.0 <0.6.0` so both packages remain installable after the minor release.

### Patch Changes

- Updated dependencies [77e024e]
- Updated dependencies [751162e]
  - @quanttrinh/qui@0.5.0

## 0.1.0

### Minor Changes

- da80998: Split the bundler plugin into `@quanttrinh/qui-unplugin`, add external component stylesheet support, separate the document-only theme from shadow-root CSS, and flatten the hydrate output.
  
  - Add `Qui.vite({ styles: { href } })` for an existing app/component stylesheet without a blob URL. Vite marks a matching document link and applies its configured base. External mode is Vite-only and uses marked document links as the source of truth.
  - External styles do not import `theme.css` by default. Use `styles: { href, theme: true }` when the plugin should load the library theme.
  - Generate `theme.css` directly from the theme source. It is document-only, contains custom properties and `@property` registrations, has no `:host` fallback, and establishes canonical layer order.
  - Replace the root layer order declaration in generated `styles.css` with individual declarations so Panda does not re-expand dependency CSS.
  - Move the plugin to `packages/unplugin` as `@quanttrinh/qui-unplugin` with a compatible main-package peer range (`>=0.3.1 <0.5.0`). `@quanttrinh/qui/unplugin` is removed; install the plugin package and import it directly.
  - Move `@quanttrinh/qui` into `packages/qui` and make the repository root a private workspace.
  - Flatten the hydrate build output to `dist/hydrate/`.
  - Make the published runtime self-contained by inlining the DOM element check.
  
  This repository treats a minor release of a `0.x` package as the breaking-change signal.

### Patch Changes

- Updated dependencies [da80998]
  - @quanttrinh/qui@0.4.0
