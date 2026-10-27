# @quanttrinh/qui-unplugin

Bundler plugin for `@quanttrinh/qui`. It scans JSX/TSX and MDX source for used
`qui-*` tags, emits static component registration imports, and configures the
component stylesheet used by shadow roots.

## Install

```sh
bun add -d @quanttrinh/qui-unplugin
```

`@quanttrinh/qui` must also be installed.

## Vite

```ts
import Qui from "@quanttrinh/qui-unplugin";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [Qui.vite()],
});
```

External component/app stylesheet:

```ts
Qui.vite({ styles: { href: "/assets/qui-app.css" } });
```

External `href` mode is Vite-only. Other adapters can use the plugin with
`styles: false` and mark the document stylesheet themselves.

See the main package README for component, theme, SSR, and styling guidance:
https://github.com/quanttrinh/qui/tree/main/packages/qui#readme
