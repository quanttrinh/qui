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

SSR pages do not pass through Vite's HTML transform. Resolve the final URL(s),
then ensure the document has a marked stylesheet link. Missing links are
inserted before `</head>`, matching the main package's SSR helper:

```ts
import { renderPage } from "@quanttrinh/qui-server";
import { ensureStylesheetLinks, type QuiStylesOptions } from "@quanttrinh/qui-unplugin";
import { resolveStylesheetHrefs } from "@quanttrinh/qui/ssr";

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

// Includes the Vite base. Pass the same values to withShadowStylesheet().
const hrefs = await resolveStylesheetHrefs(styles.href, context);
const { html: renderedHtml } = await renderPage(markup, {
    fullDocument: false,
    styles: { href: hrefs },
});

const html = ensureStylesheetLinks(renderedHtml, hrefs);
```

Use `markStylesheetLinks()` when the document link is guaranteed to exist and
you only need to add the marker. `ensureStylesheetLinks()` marks existing links
and inserts missing ones. `ensureExternalStylesheetLinks()` combines URL
resolution and insertion for base-relative hrefs.

### Output-aware registration

Source scanning cannot see components rendered from CMS data, Markdown, HTML
strings, or other runtime output. Write a registration manifest from the
rendered page metadata, then import the manifest virtual module from the client
entry:

```ts
import { renderPage } from "@quanttrinh/qui-server";
import { writeRegistrationManifest } from "@quanttrinh/qui-unplugin";

const { registration } = await renderPage(markup, {
    styles: { href: "/assets/qui-app.css" },
});

await writeRegistrationManifest("./.qui/components.json", registration.components);
```

Write the manifest once after rendering all pages (build/SSG), not per request.
Relative paths resolve from `process.cwd()`; the plugin reads them from the Vite
root, so keep both roots aligned or use an absolute path.

```ts
// vite.config.ts
Qui.vite({
    registration: { manifest: "./.qui/components.json" },
});
```

```ts
// client entry
import "virtual:qui/registration-manifest";
```

The manifest module is generated at build time with static imports for every
rendered tag. Tags found in authored source are still registered by the normal
per-file transform, so the two paths combine without runtime tag scanning.
Additional tags can be supplied with `registration.components`.

`@quanttrinh/qui-server` also returns `registration.module` and
`registration.manifest` directly when a build pipeline needs to write its own
module or manifest.

`bundle` is the Rollup/Vite output bundle (`type`, `fileName`), not
`.vite/manifest.json`. Map manifest entries to that shape if the server only has
a manifest. If `ensureStylesheetLinks()`, `ensureExternalStylesheetLinks()`, or
`markExternalStylesheetLinks()` is imported by a production SSR server, install
`@quanttrinh/qui-unplugin` as a runtime dependency; the development dependency
above is enough for build-time/SSG usage.

Pass the same resolved URL to the main package's `withShadowStylesheet()` helper
so declarative shadow roots use the same emitted asset.

External `href` mode is Vite-only for automatic marking. Other adapters can use
the plugin with `styles: false` and mark the document stylesheet themselves.

See the main package README for component, theme, SSR, and styling guidance:
https://github.com/quanttrinh/qui/tree/main/packages/qui#readme
