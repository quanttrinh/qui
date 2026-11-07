# @quanttrinh/qui-server

## 0.1.1

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

## 0.1.0

### Minor Changes

- 1cb9681: Improve and align SSR/SSG stylesheet handling.
  
  `withShadowStylesheet()` now adds or reconciles the document-level stylesheet link before hydration, so components inject their own shadow-root links without a second document traversal. It exposes typed Stencil hydrate options and supports CSP nonces. Add `injectDocumentStylesheet()` for servers that manage their own document. Remove the unsupported `serializeShadowRoot: "scoped"` type option.
  
  Add `@quanttrinh/qui-server`, a Node-only server-first package. It normalizes `hydrateDocument()` to always return serialized HTML, exposes styled `renderToString()` and `renderPage()` helpers, collects rendered component tags, generates document shells, and adds `renderToStream()` for flushing a document shell before rendering. Keeping these helpers in a separate package avoids adding HTML parsing and server-only dependencies to the browser runtime. Add downstream framework integration documentation for Astro, Next.js, Remix, Nuxt, Express, and Koa.
  
  Add output-aware registration. Server results now include the rendered component list plus a static registration module and JSON manifest. `writeRegistrationManifest()` writes that manifest for the unplugin's new `virtual:qui/registration-manifest` build-time module, so components rendered from CMS data, Markdown, HTML strings, or other dynamic output are registered on the client alongside source-scanned tags.
  
  Move generic stylesheet URL resolution to the shared SSR/internal layer.
  
  Add an internal `@quanttrinh/qui/internal` entry point so the runtime, SSR helper, and unplugin share the same stylesheet marker, href normalization, primary-stylesheet detection, and URL resolution. The unplugin now exports `ensureStylesheetLinks()` and `ensureExternalStylesheetLinks()`, which mark matching links, insert missing links before `</head>`, and remove stale managed links. The unplugin's source extraction now uses Oxc's visitor API instead of a hand-rolled AST walker.
  
  Replace the custom module builder with `tsdown` for package builds, bundleless ESM output, and declaration generation. Server and unplugin builds use `tsdown.config.ts` files directly. They now fail on `publint` and `arethetypeswrong` package validation errors; the main package runs `publint` after its production build.

### Patch Changes

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
