---
"@quanttrinh/qui": major
"@quanttrinh/qui-unplugin": minor
---

Publish the bundler plugin as a separate `@quanttrinh/qui-unplugin` package.

The plugin now lives outside the main component package, so component consumers
no longer install `unplugin`, `oxc-parser`, `parse5`, `gray-matter`, `pathe`, or
`magic-string` unless they use auto-registration.

```ts
import Qui from "@quanttrinh/qui-unplugin";
```

`@quanttrinh/qui/unplugin` is removed. Install
`@quanttrinh/qui-unplugin` as a development dependency and update the import.
