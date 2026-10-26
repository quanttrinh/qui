---
"@quanttrinh/qui": minor
---

Add the `@quanttrinh/qui/ssr` entry point.

`withShadowStylesheet()` injects an external `link[data-qui-styles]` into every
`qui-*` shadow root emitted by Stencil's declarative shadow DOM output.

```ts
import { renderToString } from "@quanttrinh/qui/hydrate";
import { withShadowStylesheet } from "@quanttrinh/qui/ssr";

const { html } = await renderToString(
  markup,
  withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
);
```

`injectShadowStylesheet()` is also exported for callers that already own the
hydration document.
