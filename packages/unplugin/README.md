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

Vite marks the matching document `<link>` during development and build. A
content-hashed build URL can be passed directly, or resolved from the emitted
bundle when the hash is not known up front. Resolve the dev URL explicitly,
because `transformIndexHtml` has no `bundle` while serving:

```ts
Qui.vite({
    styles: {
        href: ({ command, bundle }) => {
            if (command === "serve") {
                return "/assets/qui-app.css";
            }
            const asset = Object.keys(bundle ?? {}).find(
                (file) => file.startsWith("assets/qui-app-") && file.endsWith(".css"),
            );
            return asset === undefined ? undefined : `/${asset}`;
        },
    },
});
```

The resolver receives `command`, `mode`, `base`, `isSsrBuild`, the HTML
`path`/`filename`, and the build `bundle` (or dev `server`). It may be async and
may return a string, a string array, or `undefined`. Resolver and static hrefs
should be base-relative; Vite applies `base` unconditionally to root-relative
URLs, so including the base in `href` would prefix it twice.

SSR pages do not pass through Vite's HTML transform. Resolve the final URL(s)
first, render them into the document, then mark the matching links:

```ts
import {
    markStylesheetLinks,
    resolveStylesheetHrefs,
    type QuiStylesOptions,
} from "@quanttrinh/qui-unplugin";

const styles = {
    href: ({ command, bundle }) => {
        if (command === "serve") {
            return "/assets/qui-app.css";
        }
        const asset = Object.keys(bundle ?? {}).find(
            (file) => file.startsWith("assets/qui-app-") && file.endsWith(".css"),
        );
        return asset === undefined ? undefined : `/${asset}`;
    },
} satisfies QuiStylesOptions;

const context = {
    command: "build",
    mode: "production",
    base: "/",
    isSsrBuild: true,
    bundle: viteBuildBundle,
};

// Includes the Vite base. Render these URLs into the document and pass the
// same values to withShadowStylesheet().
const hrefs = await resolveStylesheetHrefs(styles.href, context);
const renderedHtml = await renderPage({ stylesheets: hrefs });

const html = markStylesheetLinks(renderedHtml, hrefs);
```

`bundle` is the Rollup/Vite output bundle (`type`, `fileName`), not
`.vite/manifest.json`. Map manifest entries to that shape if the server only has
a manifest. If `markExternalStylesheetLinks()` is imported by a production SSR
server, install `@quanttrinh/qui-unplugin` as a runtime dependency; the
development dependency above is enough for build-time/SSG usage.

Pass the same resolved URL to the main package's `withShadowStylesheet()` helper
so declarative shadow roots use the same emitted asset.

External `href` mode is Vite-only for automatic marking. Other adapters can use
the plugin with `styles: false` and mark the document stylesheet themselves.

See the main package README for component, theme, SSR, and styling guidance:
https://github.com/quanttrinh/qui/tree/main/packages/qui#readme
