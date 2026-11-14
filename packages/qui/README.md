# @quanttrinh/qui

Material Design 3 web components built with [Stencil](https://stenciljs.com/) and
styled with [PandaCSS](https://panda-css.com/).

The package ships client-side custom elements, one shared component stylesheet,
and a Stencil hydrate module for SSR/SSG.

## Installation

The package is published to GitHub Packages.

Create an `.npmrc` in the project or user config:

```ini
@quanttrinh:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` needs at least `read:packages`.

```sh
bun add @quanttrinh/qui
```

## TypeScript

Importing from the package root loads Stencil's global element declarations.
Use the generated `HTMLQui*Element` types instead of intersecting `HTMLElement`
with the component props:

```ts
import type { Components } from "@quanttrinh/qui";

const button = document.querySelector("qui-button") as HTMLQuiButtonElement;
button.disabled = true;

const input = document.querySelector("qui-input") as HTMLQuiInputElement;
input.value = "hello";

// Component prop interfaces are also available by name.
const props: Components.QuiButton = button;
```

Component subpath imports such as `@quanttrinh/qui/shared/qui-button` load the
same declarations.

### React, Solid, and Preact

The package generates framework JSX declarations with
`@stencil/types-output-target`. Import the file for the framework you use once,
in the app's type entry:

```ts
// React 19+
import "@quanttrinh/qui/types/react";

// Solid
// import "@quanttrinh/qui/types/solid";

// Preact
// import "@quanttrinh/qui/types/preact";
```

Each file augments that framework's `JSX.IntrinsicElements` with every `qui-*`
element, its props, and its Stencil custom events. The entries are type-only and
ship an empty runtime module, so a side-effect import resolves safely in
bundlers. `@types/react`, `solid-js`, and `preact` are optional peer
dependencies; consumers only need the framework they use.

Stencil custom event names must stay lowercase so the generated React handler
props match the dispatched event names.

Solid uses Stencil's prefixed props and events:

```tsx
import "@quanttrinh/qui/types/solid";

<qui-button prop:variant="filled" prop:size="sm" />;
<qui-checkbox prop:checked on:checkedchange={(event) => event.detail.checked} />;
```

Preact uses the exact Stencil prop and event names. Preact assigns properties
when they exist, so use `iconOnly`, not `icon-only`:

```tsx
import "@quanttrinh/qui/types/preact";

<qui-button variant="filled" size="sm" iconOnly label="Add" />;
<qui-checkbox oncheckedchange={(event) => event.detail.checked} />;
```

The declarations use `export type *` and require TypeScript 5.0 or newer. The
Preact declarations require Preact 10.28 or newer, including Preact 11.

The React declarations target React 19+, which supports custom elements
natively.

## Quick start

`theme.css` establishes the canonical Panda layer order. If app CSS loads
before the library theme, keep the same order in that entry file:

```css
@layer reset, base, tokens, recipes, utilities;
```

Load the theme once in the document:

```ts
import "@quanttrinh/qui/theme.css";
```

Shadow roots need a component/app stylesheet URL. Load
`@quanttrinh/qui/styles.css` (or the app's combined component stylesheet) once
in an asset you can mark separately, then mark _only that link_:

```ts
import "@quanttrinh/qui/styles.css";
```

```html
<link rel="stylesheet" href="/assets/qui-components.css" data-qui-styles />
```

Use the URL your bundler emits for that CSS. If it is hashed, mark the emitted
link with `data-qui-styles` or copy/serve the sheet at a stable path.

Do not put `theme.css` in that marked file and do not mark a bundle that
contains it. The theme's custom properties inherit into shadow roots; adopting
a second copy can override brand values. If the bundler injects CSS as a
`<style>` tag or combines theme and component CSS, configure the component
sheet URL explicitly or use the unplugin external mode below:

```ts
import { setQuiStylesHref } from "@quanttrinh/qui/runtime";

setQuiStylesHref("/assets/qui-components.css");
```

That URL must be a real document stylesheet; the setter only tells shadow roots
which URL to link. If the bundler only injects a `<style>` tag, serve the
component CSS separately or use a real marked `<link>`.

Register only the components used by the page:

```ts
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
import { defineCustomElement as defineInput } from "@quanttrinh/qui/shared/qui-input";

defineComponents(defineButton, defineInput);
```

```html
<qui-input placeholder="Email" autocomplete="email"></qui-input>
<qui-button variant="filled">Save</qui-button>
```

`defineComponents()` imports no components itself. Only the component modules
you pass in are included in the bundle. There is no lazy loader, dynamic import
or per-tag network waterfall.

## Components

Each component is documented next to its source in
[`src/components`](./src/components/README.md). That index lists every tag and
links to usage, properties, events, methods, slots, CSS parts, and behavior.

## Registering components

Every generated component module exports a `defineCustomElement` function:

```ts
import { defineCustomElement } from "@quanttrinh/qui/shared/qui-button";
defineCustomElement();
```

Use the root `register` helper to register several definitions in one place:

```ts
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
import { defineCustomElement as defineSelect } from "@quanttrinh/qui/shared/qui-select";

defineComponents(defineButton, defineSelect);
```

Composite components need all tags in their composition registered. A dialog
page, for example, needs `qui-dialog`, its trigger, content, title, description,
actions and close parts.

Importing `@quanttrinh/qui` directly pulls in the full component barrel. Use
component subpaths when bundle size matters.

## Auto-registration plugin

`@quanttrinh/qui-unplugin` scans JSX/TSX and MDX source for used `qui-*` tags.
For client modules it injects one static registration module per set of
components. It also configures the component stylesheet used by shadow roots.
It is published separately so component-only consumers do not install the
bundler/parser dependencies.

By default the virtual styles module imports the document-only `theme.css` and
embeds `styles.css` in a shared blob URL. Do not also add the Quick start CSS
imports in that mode, or the shared CSS is emitted twice. Astro pages need the
explicit registration script described below.

Install it as a development dependency:

```sh
bun add -d @quanttrinh/qui-unplugin
```

The plugin uses unplugin v3, which is ESM-only and requires Node.js `20.19+`
within Node 20, or `22.12+`. Node 21 is not supported.

```ts
import Qui from "@quanttrinh/qui-unplugin";
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [Qui.vite()],
});
```

For an app-generated component stylesheet, point the plugin at its URL instead
of embedding a blob:

```ts
Qui.vite({ styles: { href: "/assets/qui-app.css" } });
```

In external mode the plugin does not create document markup at runtime. Vite
adds `data-qui-styles` when the document link matches the configured href
exactly:

```html
<link rel="stylesheet" href="/assets/qui-app.css" data-qui-styles />
```

`href` should be a stable public URL. Vite applies its configured `base` when
matching and marking the document link. A content-hashed URL works when it is
known at configuration time. When it is not, use a resolver; Vite calls it with
the build bundle, where the emitted CSS asset can be selected:

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
`path`/`filename`, and the build `bundle` or dev `server`. It may be async and
may return a string, string array, or `undefined`. Resolve the dev URL explicitly
because there is no `bundle` while serving. Keep resolver and static hrefs
base-relative: Vite applies `base` unconditionally to root-relative URLs, so an
`href` that already includes the base would be prefixed twice. External mode has
no runtime fallback: marked document links are the source of truth, so shadow
roots always use their final URLs. The marked link must exist when components
connect; add it in the initial document head.

For SSR pages, rendered HTML does not pass through Vite's HTML transform. Resolve
the final URL(s) with `resolveStylesheetHrefs` from `@quanttrinh/qui/ssr`, then
ensure they are marked with `ensureStylesheetLinks` from
`@quanttrinh/qui-unplugin`. It marks existing links and inserts missing ones into
the document head. `resolveStylesheetHrefs` applies the Vite base, so pass the
same resolved URL(s) to `withShadowStylesheet()`. `ensureExternalStylesheetLinks`
combines resolution and insertion for base-relative hrefs, and
`markStylesheetLinks` remains available when the link is guaranteed to exist.

External `href` mode is Vite-only for automatic document marking because it
relies on `transformIndexHtml`. Other adapters throw; use `styles: false` and
mark the document link yourself there.

When `href` is an array, each matching link is marked but shadow roots follow
document order, not array order. Custom attributes added to a Vite-bundled CSS
link may not survive bundling; use a public/static file or a stable emitted asset
name for the marked link.

Load the theme separately, once:

```ts
import "@quanttrinh/qui/theme.css";
```

The external option never imports the theme by default because app stylesheets
often already carry their own brand values. Add `theme: true` only when the
plugin should also import the library theme:

```ts
Qui.vite({ styles: { href: "/assets/qui-app.css", theme: true } });
```

`href` can be a string or an ordered array. Use `styles: false` when the app
needs full control over styles; component registration is still automatic:

```ts
Qui.vite({ styles: false });
```

The plugin generates static imports, not a loader:

```ts
import "virtual:qui/styles";
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as __qui_0 } from "@quanttrinh/qui/shared/qui-button";

defineComponents(__qui_0);
```

The inline virtual styles module keeps an existing marked stylesheet link when
one is present. Otherwise it creates one shared blob URL for the document and
shadow roots. Use external `href` mode when a strict CSP blocks `blob:`
stylesheets. Only the component/app stylesheet is adopted by shadow roots; never
include `theme.css` in that stylesheet.

Registering the same component more than once is safe; Stencil checks
`customElements.get()` before defining it.

Tag detection uses Oxc's AST for JavaScript-family files, so tags in strings and
comments are ignored. MDX uses a lexical fallback and receives the import after
its frontmatter. Astro is not transformed. Components created with dynamic tag names or markup assembled at
runtime still need explicit `defineComponents()` registration.

The plugin handles client-side registration. It does not call
`renderToString` and does not perform SSR/SSG. Astro `.astro` page modules run on
the server, so the injected registration is not a browser script. Keep the
explicit registration `<script>` described below for native Astro templates; use
the plugin for JSX/TSX islands or other Vite, Rollup, Webpack, Rspack, and
esbuild entries.

## SSR / SSG

The package ships a Node-compatible Stencil hydrate module and a small SSR helper
that manages the component stylesheet link in the document and in each
declarative shadow root.

```ts
import { renderToString } from "@quanttrinh/qui/hydrate";
import { withShadowStylesheet } from "@quanttrinh/qui/ssr";

const { html, diagnostics } = await renderToString(
    markup,
    withShadowStylesheet({ href: "/assets/qui-components.css" }, { fullDocument: false }),
);
```

For a full document, the helper adds or marks the document-level
`<link rel="stylesheet" href="/assets/qui-components.css" data-qui-styles>` before
hydration begins. Adding the link before hydration means components can inject
their own shadow-root links through `ensureShadowStylesheet()`, and the client
runtime can discover the same URL for dynamically created components later.

Fragment output (`fullDocument: false`) does not include a document head. Add and
mark the document link yourself, as the Astro example below does.

The helper also puts one external stylesheet link into every styled `qui-*`
shadow root. Data-only and host-only roots such as `qui-option`, `qui-dialog`,
and the field helper/error/required parts receive no link because those
components do not request shadow styles. The browser fetches the URL once.

Both generated link types use the `nonce` option when one is provided. When it is
omitted, the helper reads `meta[name="csp-nonce"]` from the document:

```ts
withShadowStylesheet({ href: "/assets/qui-components.css", nonce: cspNonce });
```

`markup` should contain the complete component composition. Render nested parts
together so field, tabs, dialog and option context works during SSR.

Cross-shadow-root ARIA relationships activate after hydration. DSD provides the
structure and styles before JavaScript loads, but element-reflection wiring is
established by the client component lifecycle.

IDREF lookup is scoped to a node tree, so the `aria-labelledby` and
`aria-controls` fallback cannot resolve a target in a different shadow root.
Browsers without ARIA element reflection keep the attributes but may not
announce those cross-root relationships. Servers should therefore treat
cross-root accessible names as a post-hydration enhancement.

After hydration, register the same components on the client with
`defineComponents()`. Dynamically created components use the stylesheet URL from
`link[data-qui-styles]`, or call:

```ts
import { setQuiStylesHref } from "@quanttrinh/qui/runtime";

setQuiStylesHref("/assets/qui-components.css");
```

`setQuiStylesHref()` is a browser-runtime API. The hydrate bundle renders inside
its own mock window, so calling the runtime setter on the server does not
configure SSR. Use `withShadowStylesheet()` or `injectShadowStylesheet()` on the
server instead.

### Server entry point

Install the server package alongside the components:

```sh
bun add @quanttrinh/qui-server
```

`@quanttrinh/qui-server` normalizes the Stencil hydrate API for server use. See
[the framework integration guide](https://github.com/quanttrinh/qui/blob/main/packages/server/FRAMEWORKS.md) for Astro, Next.js,
Remix, Nuxt, Express, and Koa patterns.
`hydrateDocument()` accepts a `Document` or HTML string, always returns
serialized HTML, and accepts the same `styles` option as `renderToString()`.
Pass request-specific HTML as a string; Stencil creates and destroys a temporary
window so it is not cached between requests:

```ts
import { hydrateDocument } from "@quanttrinh/qui-server";

const { html, diagnostics } = await hydrateDocument(template, {
    styles: { href: "/assets/qui-components.css" },
});
```

Use `createWindowFromHtml()` only when you need a `Document` before hydration. It
retains one parsed template per distinct content for the process lifetime, so it
must receive stable template HTML, never per-request rendered markup.

Use the lower-level `@quanttrinh/qui/hydrate` functions only when you need direct
control. If you hydrate a document you manage yourself, you can call
`injectShadowStylesheet(document, options)` and `injectDocumentStylesheet(document,
options)` directly after hydration.

### Output-aware registration

Server-rendered components are not always visible to source scanners. The server
package returns `registration.components`, `registration.module`, and
`registration.manifest` for pages rendered from CMS data, Markdown, or HTML
strings:

```ts
import { renderPage, writeRegistrationManifest } from "@quanttrinh/qui-server";

const { registration } = await renderPage(markup, {
    styles: { href: "/assets/qui-components.css" },
});

await writeRegistrationManifest("./.qui/components.json", registration.components);
```

Configure `@quanttrinh/qui-unplugin` with the manifest and import
`virtual:qui/registration-manifest` from the client entry to register those
components alongside source-scanned tags.

### Static components

Stencil's `staticComponents` and `clientHydrateAnnotations` options are passed
through unchanged. Use `staticComponents` only for genuinely static content:
those hosts render on the server but are not hydrated on the client. Rendering
still emits the `hydrated` class, so `@undefinedContent` styles do not hide them.

### Streaming

Stencil's `streamToString()` fully renders and buffers the document before
yielding one chunk. For a shell-first response, use `renderToStream()` from
`@quanttrinh/qui-server`:

```ts
import { renderToStream } from "@quanttrinh/qui-server";

for await (const chunk of renderToStream(markup, {
    prefix: `<!doctype html><html><head>
        <link rel="stylesheet" href="/assets/qui-components.css" data-qui-styles>
        </head><body>`,
    suffix: "</body></html>",
    styles: { href: "/assets/qui-components.css" },
})) {
    response.write(chunk);
}
```

The prefix is yielded before component rendering starts, so the document head can
flush while the component tree renders. Stencil still buffers the component body,
so this is not progressive component streaming.

### CSS for SSR

Load `theme.css` in the document. The component/app stylesheet is added to full
documents by `withShadowStylesheet()`, and shadow roots receive the same
stylesheet through the helper. SSR serialization supports only declarative
shadow DOM, or `serializeShadowRoot: false` to defer rendering to the client.

The custom elements build uses `externalRuntime: false`. Stencil's external
client runtime is compiled with `hydrateClientSide: false`; inlining the runtime
enables the hydrate path for the custom elements build. Without it, server
markup is treated as slot content and the rendered DOM is duplicated on upgrade.

### Astro

Astro can render the hydrate output with `set:html`:

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

<link rel="stylesheet" href={stylesUrl} data-qui-styles />
<Fragment set:html={html} />

<script>
  import { defineComponents } from "@quanttrinh/qui/register";
  import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
  defineComponents(defineButton);
</script>
```

Astro emits the client entry at the end of `<body>`. Add a `modulepreload` for
the entry script in the head if needed. Preserve Stencil's hydration annotations;
do not strip comments from the rendered markup.

## Styling

```sh
bun run build
```

- `theme.css` — CSS custom properties and light/dark values; document only
- `styles.css` — reset, tokens, recipes and component utilities; safe to adopt
  in shadow roots

Load `theme.css` once in the document. It provides the custom-property values
that inherit into shadow roots. Never put `theme.css` in the marked component
stylesheet or adopt it into a shadow root: its document selectors are not
component styles, and a shadow-root copy would override consumer brand values.

Host elements use the document stylesheet for layout only, primarily `display`.
Visual styling lives on the internal root, which the same stylesheet styles
inside each shadow root. Use `::part(...)` for stable internal styling;
`innerClass` has been removed.

```css
/* External layout */
qui-card {
    width: 100%;
    margin-block: 2rem;
}

/* Component visuals */
qui-card::part(root) {
    background: white;
    padding: 2rem;
}
```

The generated stylesheet briefly hides popover, select, combobox, dialog body,
tab panel, and accordion body content until their custom elements are defined.
This prevents server-rendered or static markup from flashing hidden content
before Stencil takes over. Server-rendered hosts that already carry Stencil's
`hydrated` class stay visible. If client JavaScript never runs, those
client-only content areas remain hidden.

### Use with Panda

Point an app's Panda config at the package design system:

```ts
// panda.config.ts
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    designSystem: "@quanttrinh/qui",
    include: ["./src/**/*.{js,jsx,ts,tsx,astro}"],
    outdir: "styled-system",
});
```

This shares tokens, recipes and extracted component styles with the app's own
Panda CSS. Generate one component/app stylesheet and mark its document link:

```html
<link rel="stylesheet" href="/assets/qui-app.css" data-qui-styles />
```

That combined component/app stylesheet is loaded in the document and used by
every shadow root. To opt out of sharing app styles with components, load
`@quanttrinh/qui/styles.css` instead and keep the app stylesheet document-only.

Load `theme.css` globally, once, from the client entry or document. It is
document-only and should not be part of the marked component/app stylesheet.

```ts
// src/main.ts (client entry)
import "@quanttrinh/qui/theme.css";
```

To derive and apply a Material scheme at runtime, use the theme entry point.
`applyTheme()` writes every `--md-sys-color-*` property and returns the resolved
colors:

```ts
import { applyTheme, clearColors } from "@quanttrinh/qui/theme";

applyTheme({ source: "#3e802b", variant: "tonalSpot", dark: true });

// Return to the stylesheet-provided theme
clearColors();
```

`applyTheme()` writes through the CSSOM (`style.setProperty`), not inline
`<style>` elements or `style` attributes, so it works with strict `style-src`
and `style-src-attr` policies.

```ts
// vite.config.ts
export default defineConfig({
    plugins: [Qui.vite({ styles: { href: "/assets/qui-app.css" } })],
});
```

The generated library CSS removes the root layer order declaration that triggers
Panda's PostCSS integration, while preserving nested recipe layer declarations.
Keep the app's own `@layer reset, base, tokens, recipes, utilities;` entry file
once; do not point the shadow-root href at it.

Low-level generated exports are also available:

```ts
import { css } from "@quanttrinh/qui/css";
import { flex } from "@quanttrinh/qui/patterns";
```

## Distribution layout

`bun run build:all` produces:

```text
dist/shared/                 custom-elements build
dist/hydrate/                SSR/SSG hydrate module
dist/utilities/              compiled utility modules
dist/types/                  TypeScript declarations
dist/panda/                  Panda design-system manifest
styled-system/               generated Panda CSS and types
```

Published entry points:

| Entry                          | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `@quanttrinh/qui`              | Components                            |
| `@quanttrinh/qui/shared/*`     | Individual component                  |
| `@quanttrinh/qui/register`     | Static component registration helper  |
| `@quanttrinh/qui/types/react`  | Generated React 19+ JSX declarations  |
| `@quanttrinh/qui/types/solid`  | Generated Solid JSX declarations      |
| `@quanttrinh/qui/types/preact` | Generated Preact JSX declarations     |
| `@quanttrinh/qui-unplugin`     | Auto-registration bundler plugin      |
| `@quanttrinh/qui/hydrate`      | SSR/SSG renderer                      |
| `@quanttrinh/qui/ssr`          | Document and shadow stylesheet helper |
| `@quanttrinh/qui/runtime`      | Client stylesheet configuration       |
| `@quanttrinh/qui/theme`        | Runtime color scheme helpers          |
| `@quanttrinh/qui/theme.css`    | Theme custom properties               |
| `@quanttrinh/qui/styles.css`   | Component CSS                         |
| `@quanttrinh/qui/panda/*`      | Panda manifest, preset and build info |
| `@quanttrinh/qui/css`          | Generated Panda CSS helper            |
| `@quanttrinh/qui/patterns`     | Generated Panda patterns              |
| `@quanttrinh/qui/jsx`          | Generated Panda JSX helpers           |
| `@quanttrinh/qui/tokens`       | Generated Panda tokens                |
| `@quanttrinh/qui/helpers`      | Generated Panda helpers               |
| `@quanttrinh/qui/types`        | Generated Panda types                 |

## Development

Run workspace-wide commands from the repository root. Inside this package:

```sh
bun run dev              # styles + Stencil dev server
bun run build            # production build
bun run build:all        # build plus Panda artifacts
bun run test:unit
```

Stencil generates `src/components.d.ts` during a build. On a fresh checkout, run
`bun run build` once before type-checking.

`dev` compiles utilities as part of the Stencil build. Rebuild after editing
`src/utilities/**`.

Type-check the package:

```sh
bun run typecheck
```

### Testing

Tests use `@stencil/vitest` with four projects:

- `*.unit.test.ts` / `*.unit.test.tsx` — Node tests for controllers and helpers
- `*.integration.test.ts` — SSR and hydration tests in real browsers
- `*.browser.test.tsx` — full Chromium DOM, forms, focus and popover suite
- `test/**/*.smoke.browser.test.tsx` — Chromium, Firefox and WebKit smoke suite

```sh
bun run test:unit
bun run test:integration
bun run test:browser
bun run test:smoke
bun run test
bun run test:watch
```

The root `bun run test` also runs `bun run test:framework-types`, which compiles
the consumer fixtures against the built declarations. Run `bun run build` first
so `dist/types` exists.

The package test scripts set `NODE_ENV=test`, which makes Stencil build the
test lazy loader into `.stencil-test` instead of the `www` demo output. Direct
`stencil-test` invocations need that environment variable set as well.
`vitest.setup.ts` loads that loader and the generated theme/shared styles for
browser tests.

## Reactive controllers

Controllers share a Lit-style lifecycle contract. A controller receives its
host in the constructor and registers itself, so components only declare the
fields:

```ts
export class QuiExample extends Mixin(ControllerHostMixin) {
    @Element() host!: HTMLQuiExampleElement;

    private readonly form = new FormController(this, {
        getInternals: () => this.internals,
        // ...
    });
}
```

`ReactiveControllerBase` provides `hostElement`, `requestUpdate()`, and
`requestNotify()`. `ControllerHostMixin` forwards the Stencil lifecycle hooks,
implements `addController()` / `removeController()`, and schedules renders with
`forceUpdate()`. Override `onRequestUpdate()` in a component when a controller
change also needs to notify context subscribers.

Providers whose root template only reads props can notify without rendering:
`requestNotify()` calls `notifyUpdate()` on the host, which runs
`onRequestUpdate()` without `forceUpdate()`. Hosts with no notification hook
render instead. Providers notify subscribers without computing changed keys;
`ContextPartController` parts use a `select` snapshot to skip re-renders when
the context values they render did not change.

## Implementation notes

- The original Zag integrations have been replaced with local controllers.
- Select and combobox share measured/virtualized option-list controllers.
- Form controls share `FormController` and `CheckableController`.
- Browser-only work is gated with `Build.isServer` / `Build.isBrowser`.
- `build/build-utilities.ts` compiles `src/utilities/**/*.ts` into
  `dist/utilities/`, including declarations and rewritten relative imports.
  `build` runs it after Stencil completes.
- `packages/unplugin/build/build.ts` compiles the separate plugin package into
  `packages/unplugin/dist/` using the same module builder.
- The generated `www` app is the demo/dev server; it is not the published client
  entry point.
