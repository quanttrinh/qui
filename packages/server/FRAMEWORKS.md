# Framework integration

`@quanttrinh/qui-server` renders Stencil's declarative shadow DOM markup on the
server. It does not ship framework-specific component wrappers. The integration
pattern is the same everywhere:

1. Render markup on the server with `renderToString()` or `renderPage()`.
2. Inject the rendered HTML without stripping declarative shadow roots or
   Stencil hydration comments.
3. Add the marked component stylesheet link to the document.
4. Register the same components on the client.
5. Preserve the stylesheet URL and CSP nonce across server and client.

`@quanttrinh/qui-server` is Node-only. Never import it from client bundles.

## Required document markup

For fragment output (`fullDocument: false`), the application owns the document
head. It must include the component stylesheet with `data-qui-styles`:

```html
<link rel="stylesheet" href="/assets/qui.css" data-qui-styles />
```

Load the theme separately, once per document:

```html
<link rel="stylesheet" href="/assets/theme.css" />
```

`renderPage()` generates both links for standalone Node servers. Framework
applications that control their own document shell should use fragment output and
add the links in their head layer.

## Registration choices

| Situation                                    | Registration                       |
| -------------------------------------------- | ---------------------------------- |
| Authored JSX/TSX/MDX, supported bundler      | unplugin source scanning           |
| CMS, Markdown, HTML strings, dynamic output  | output-aware registration manifest |
| Astro `.astro` pages or unsupported bundlers | explicit `defineComponents()`      |
| Static/no-JS pages                           | none                               |

Output-aware registration collects tags from rendered HTML:

```ts
const { registration } = await renderToString(markup, {
    fullDocument: false,
    styles: { href: "/assets/qui.css" },
});

await writeRegistrationManifest("./.qui/components.json", registration.components);
```

Write the manifest once after rendering all pages (build/SSG), not per request.
Relative paths resolve from `process.cwd()`; the unplugin resolves from the Vite
root, so keep both roots aligned or use an absolute path.

Then configure the unplugin and import the virtual module from the client entry:

```ts
Qui.vite({ registration: { manifest: "./.qui/components.json" } });
```

```ts
import "virtual:qui/registration-manifest";
```

## Astro

Astro page modules run on the server. Use fragment output and `set:html`:

```astro
---
import stylesUrl from "../styled-system/styles.css?url";
import "@quanttrinh/qui/theme.css";
import { renderToString } from "@quanttrinh/qui-server";

const { html } = await renderToString(`<qui-button variant="filled">Save</qui-button>`, {
  fullDocument: false,
  styles: { href: stylesUrl },
});
---
<html>
  <head>
    <link rel="stylesheet" href={stylesUrl} data-qui-styles />
  </head>
  <body>
    <Fragment set:html={html} />
  </body>
</html>
```

Astro does not pass `.astro` files through the unplugin source scanner. Register
components with an explicit client script, or generate a manifest from the tags
you render and import `virtual:qui/registration-manifest`:

```astro
<script>
  import { defineComponents } from "@quanttrinh/qui/register";
  import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
  defineComponents(defineButton);
</script>
```

## Next.js App Router

Render in a Server Component and inject the fragment:

```tsx
// app/page.tsx
import { renderToString } from "@quanttrinh/qui-server";

export default async function Page() {
    const { html } = await renderToString(`<qui-button variant="filled">Save</qui-button>`, {
        fullDocument: false,
        styles: { href: "/assets/qui.css" },
    });

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Add the marked stylesheet link through the application's document/head layer.
Register components from a client-only module:

```tsx
// app/qui-registration.tsx
"use client";

import "virtual:qui/registration-manifest";
```

If the Next bundler integration is not configured for the virtual module, use
explicit `defineComponents()` calls in a client module instead. Never import
`@quanttrinh/qui-server` from a client component.

## Remix

Render in a loader or server-side route module:

```ts
import { renderToString } from "@quanttrinh/qui-server";

export async function loader() {
    const { html } = await renderToString(markup, {
        fullDocument: false,
        styles: { href: "/assets/qui.css" },
    });
    return { html };
}
```

Then inject it in the route component with `dangerouslySetInnerHTML`. Remix's
Vite integration can use `@quanttrinh/qui-unplugin` for authored source scanning.
For rendered output that source scanning cannot see, import
`virtual:qui/registration-manifest` from `entry.client.tsx` or use explicit
registration.

## Nuxt

Render inside a server route, server plugin, or `useAsyncData` handler:

```ts
import { renderToString } from "@quanttrinh/qui-server";

const { html } = await renderToString(markup, {
    fullDocument: false,
    styles: { href: "/assets/qui.css" },
});
```

Inject the fragment with `v-html`. Add the marked stylesheet link in
`app.head`/`useHead`. Register components in a client plugin:

```ts
// plugins/qui.client.ts
import "virtual:qui/registration-manifest";
```

Nuxt's Vite integration can use the unplugin for authored source scanning.

## Express and Koa

Use `renderPage()` for a complete response:

```ts
import { renderPage } from "@quanttrinh/qui-server";

app.get("/", async (request, response) => {
    const { html, diagnostics } = await renderPage(markup, {
        title: "Home",
        themeHref: "/assets/theme.css",
        styles: { href: "/assets/qui.css" },
    });

    if (diagnostics.length > 0) {
        // log or fail the request
    }
    response.type("html").send(html);
});
```

Use `renderToStream()` when the response should flush the document head before
the component tree finishes:

```ts
for await (const chunk of renderToStream(markup, {
  styles: { href: "/assets/qui.css" },
})) {
  response.write(chunk);
}
response.end();
```

Stencil still buffers the component body; only the generated shell is flushed
early.

## Hydration rules

- Preserve `<template shadowrootmode="open">` content.
- Preserve Stencil hydration comments and `s-*`/`c-*` attributes.
- Do not run SSR output through HTML sanitizers that remove templates or comments.
- Hydrate the client with the same component stylesheet URL.
- Keep `theme.css` document-only; do not pass it as `styles.href`.
- `serializeShadowRoot: false` disables DSD and defers rendering to the client.

For CSP, pass the same nonce to the stylesheet options and the framework's
script/style policy:

```ts
await renderToString(markup, {
    fullDocument: false,
    styles: { href: "/assets/qui.css", nonce: cspNonce },
});
```
