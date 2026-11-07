---
"@quanttrinh/qui": patch
"@quanttrinh/qui-server": patch
"@quanttrinh/qui-unplugin": patch
---

Fix the published Panda preset and peer dependency metadata.

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
