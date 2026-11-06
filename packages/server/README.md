# @quanttrinh/qui-server

Server-first SSR/SSG helpers for `@quanttrinh/qui`.

This package is Node-only. It wraps Stencil's hydrate module, generates document
shells, resolves stylesheet URLs, collects rendered component tags, and provides
shell-first streaming without adding server dependencies to the browser runtime.

See [FRAMEWORKS.md](./FRAMEWORKS.md) for Astro, Next.js, Remix, Nuxt, Express,
Koa, and general downstream integration guidance.

## Install

```sh
bun add @quanttrinh/qui @quanttrinh/qui-server
```

## Render a page

```ts
import { renderPage } from "@quanttrinh/qui-server";

const { html, diagnostics, components } = await renderPage(markup, {
    title: "Settings",
    themeHref: "/assets/theme.css",
    styles: { href: "/assets/qui.css" },
});
```

`renderPage` generates:

- `<!doctype html>` and the document shell
- the theme stylesheet link
- the marked `link[data-qui-styles]`
- the rendered component body

`components` is the sorted list of `qui-*` tags found in the rendered fragment.

## Render a fragment

```ts
import { renderToString } from "@quanttrinh/qui-server";

const { html } = await renderToString(markup, {
    fullDocument: false,
    styles: { href: "/assets/qui.css" },
});
```

## Hydrate an existing document

`hydrateDocument()` always returns serialized HTML, unlike Stencil's raw helper:

```ts
import { createWindowFromHtml, hydrateDocument } from "@quanttrinh/qui-server";

const window = createWindowFromHtml(template, requestId);
const { html, diagnostics } = await hydrateDocument(window.document, {
    styles: { href: "/assets/qui.css" },
});
```

## Stream a page

`renderToStream()` yields the generated document shell before rendering starts,
so the head can flush early. Stencil buffers the component body; the body is not
progressively rendered.

```ts
import { renderToStream } from "@quanttrinh/qui-server";

for await (const chunk of renderToStream(markup, {
    styles: { href: "/assets/qui.css" },
    onDiagnostics(diagnostics) {
        // report render diagnostics
    },
})) {
    response.write(chunk);
}
```

## Shared renderer

```ts
import { createQuiRenderer } from "@quanttrinh/qui-server";

const qui = createQuiRenderer({
    styles: { href: "/assets/qui.css" },
    themeHref: "/assets/theme.css",
});

const { html } = await qui.renderPage(markup, { title: "Home" });
```

## Stylesheet URL resolution

```ts
import { resolveStylesheetHrefs } from "@quanttrinh/qui-server";

const hrefs = await resolveStylesheetHrefs("/assets/qui.css", {
    command: "build",
    mode: "production",
    base: "/app/",
    isSsrBuild: true,
});
```

## CSP

Pass `nonce` with the stylesheet options. It is applied to generated document and
shadow-root stylesheet links:

```ts
await renderPage(markup, {
    styles: { href: "/assets/qui.css", nonce: cspNonce },
});
```

## Output-aware registration

Every render result includes registration metadata for the components actually
rendered:

```ts
const { registration } = await renderPage(markup, {
    styles: { href: "/assets/qui.css" },
});

registration.components; // ["qui-button", "qui-card"]
registration.module; // static import/define module source
registration.manifest; // JSON manifest
```

Write the manifest for the unplugin's build-time registration module:

```ts
import { writeRegistrationManifest } from "@quanttrinh/qui-server";

await writeRegistrationManifest("./.qui/components.json", registration.components);
```

Then configure the unplugin and import the virtual module from the client entry:

```ts
Qui.vite({
    registration: { manifest: "./.qui/components.json" },
});
```

```ts
import "virtual:qui/registration-manifest";
```

This registers components that were rendered from CMS data, Markdown, HTML
strings, or any other output the source scanner cannot see. Authored-source tags
continue to be registered by the normal transform.

## Client registration

This package renders server markup. Register components on the client with
`@quanttrinh/qui/register`, `virtual:qui/registration-manifest`, or the
`@quanttrinh/qui-unplugin` source auto-registration plugin.
