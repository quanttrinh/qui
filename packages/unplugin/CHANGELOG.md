# @quanttrinh/qui-unplugin

## 0.3.1

### Patch Changes

- ce8a29d: Fix the published Panda preset and peer dependency metadata.
  
  The Panda preset bundled by `panda lib` no longer scans the consumer's
  `src/components` directory at runtime. A generated tag module is baked into the
  preset, so consumer projects keep the undefined-content guard without needing a
  matching source tree. The tag module is produced from the component source with
  Oxc's parser by the Stencil styles plugin, so it stays in sync with the component
  build without a separate generation step.
  
  Replace the `workspace:^` peer ranges in `@quanttrinh/qui-server` and
  `@quanttrinh/qui-unplugin` with concrete `@quanttrinh/qui` ranges. Bun publishes
  the workspace protocol literally, which made both packages impossible to resolve
  against a published `@quanttrinh/qui` release.
  
  Remove the ignored `exports` field from Stencil's generated hydrate
  `package.json` during `postbuild`. The file remains for CommonJS module-type
  resolution, but its nested `exports` field is ignored by Node and caused a
  publint warning.
- Updated dependencies [ce8a29d]
  - @quanttrinh/qui@0.7.1

## 0.3.0

### Minor Changes

- 1cb9681: Improve and align SSR/SSG stylesheet handling.
  
  `withShadowStylesheet()` now adds or reconciles the document-level stylesheet link before hydration, so components inject their own shadow-root links without a second document traversal. It exposes typed Stencil hydrate options and supports CSP nonces. Add `injectDocumentStylesheet()` for servers that manage their own document. Remove the unsupported `serializeShadowRoot: "scoped"` type option.
  
  Add `@quanttrinh/qui-server`, a Node-only server-first package. It normalizes `hydrateDocument()` to always return serialized HTML, exposes styled `renderToString()` and `renderPage()` helpers, collects rendered component tags, generates document shells, and adds `renderToStream()` for flushing a document shell before rendering. Keeping these helpers in a separate package avoids adding HTML parsing and server-only dependencies to the browser runtime. Add downstream framework integration documentation for Astro, Next.js, Remix, Nuxt, Express, and Koa.
  
  Add output-aware registration. Server results now include the rendered component list plus a static registration module and JSON manifest. `writeRegistrationManifest()` writes that manifest for the unplugin's new `virtual:qui/registration-manifest` build-time module, so components rendered from CMS data, Markdown, HTML strings, or other dynamic output are registered on the client alongside source-scanned tags.
  
  Move generic stylesheet URL resolution to the shared SSR/internal layer.
  
  Add an internal `@quanttrinh/qui/internal` entry point so the runtime, SSR helper, and unplugin share the same stylesheet marker, href normalization, primary-stylesheet detection, and URL resolution. The unplugin now exports `ensureStylesheetLinks()` and `ensureExternalStylesheetLinks()`, which mark matching links, insert missing links before `</head>`, and remove stale managed links. The unplugin's source extraction now uses Oxc's visitor API instead of a hand-rolled AST walker.
  
  Replace the custom module builder with `tsdown` for package builds, bundleless ESM output, and declaration generation. Server and unplugin builds use `tsdown.config.ts` files directly. They now fail on `publint` and `arethetypeswrong` package validation errors; the main package runs `publint` after its production build.

### Patch Changes

- 1cb9681: Reorganize the build pipeline around a shared build config and async build helpers. Utility, theme, and style modules now expose focused entry points, Stencil output targets are gated for test and dev builds, and production type finalization runs automatically after the build.
  
  Replace component controller base classes with composable mixins (`ControllerHostMixin`, `FormControlMixin`, and `OptionControlMixin`), and extract dedicated field and field-part controllers. The public `ControllerHostBase` export is replaced by these mixins.
  
  Replace `qui-field`'s `elementIds` object prop with simple string props: `rootId`, `controlId`, `labelId`, `errorTextId`, and `helperTextId`. This makes every field id override usable as an HTML attribute and in SSR markup.
  
  Remove the function variant from `qui-popover`'s `anchor` prop. It now accepts only an `HTMLElement`; the previous sibling remains the default.
  
  Mark complex props as property-only with `attribute: null`: `items`, `optionRender`, `value`, and `defaultValue` on select/combobox, `value` and `defaultValue` on accordion, `filter` on combobox, and `anchor` on popover. Setting these through HTML attributes previously assigned a string to an array/object/function prop.
- 1cb9681: Reorganize shared component internals into focused `aria`, `context`, `controllers`, `dom`, `forms`, `option`, and `styles` modules, and move test utilities and smoke coverage under `tests/`. Controller state and comparison guards were simplified, and stricter type-aware linting plus shared tooling ignore patterns were enabled.
  
  The unplugin uses Oxc's synchronous parser for per-module transforms, which avoids async parsing overhead, and reads the shared stylesheet on demand so watch rebuilds pick up CSS edits.
- 1cb9681: Streamline the build and theme tooling. Build paths are centralized, utility compilation runs as a Stencil output target, test and dev builds skip production-only outputs, type finalization runs automatically after production builds, and type checking now uses Oxlint's type-aware mode.
  
  Undefined-content components are discovered from `@undefinedContent` source markers, and the color/theme helpers build role records directly while removing redundant variable helpers.
- 1cb9681: Move lint and formatter ignore configuration into package-level configs and remove the shared root ignore module. This is a tooling-only change with no runtime behavior changes.
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [7d7b6d3]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
- Updated dependencies [1cb9681]
  - @quanttrinh/qui@0.7.0

## 0.2.1

### Patch Changes

- Updated dependencies [ce1e172]
- Updated dependencies [4240263]
- Updated dependencies [55a6238]
- Updated dependencies [8805334]
  - @quanttrinh/qui@0.6.0

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
