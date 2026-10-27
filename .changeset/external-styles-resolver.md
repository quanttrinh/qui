---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": minor
---

Resolve and mark content-hashed component stylesheets, including SSR output.

- Allow `styles.href` to be an async resolver that receives the Vite command, mode, base, HTML path, and build bundle, so content-hashed CSS assets can be marked without hard-coding the hash. The resolver context correctly distinguishes client and SSR builds.
- Export `resolveStylesheetHrefs` and `markExternalStylesheetLinks` for SSR/SSG pipelines that render HTML outside Vite's `transformIndexHtml`. Resolved URLs include the Vite base, and the public helper validates malformed styles.
- Cache the normalized configured stylesheet href list, query only `link[data-qui-styles]`, and ignore unrelated link mutations when invalidating discovered stylesheet URLs.
- Export the `data-qui-styles` attribute and link selector from the runtime so SSR and test helpers share one definition instead of duplicating constants.
- Widen the plugin peer range to `>=0.4.0 <0.6.0` so both packages remain installable after the minor release.
