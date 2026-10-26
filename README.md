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

## Quick start

Load the theme once and the shared component stylesheet once:

```ts
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/styles.css";
```

Shadow roots need a discoverable stylesheet URL. Mark the generated document
link with `data-qui-styles`:

```html
<link rel="stylesheet" href="/assets/qui.css" data-qui-styles />
```

If the bundler injects CSS as a `<style>` tag, configure the URL instead:

```ts
import { setQuiStylesHref } from "@quanttrinh/qui/runtime";

setQuiStylesHref("/assets/qui.css");
```

Register only the components used by the page:

```ts
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
import { defineCustomElement as defineInput } from "@quanttrinh/qui/shared/qui-input";

defineComponents(defineButton, defineInput);
```

```html
<qui-input placeholder="Email" input-type="email"></qui-input>
<qui-button variant="filled">Save</qui-button>
```

`defineComponents()` imports no components itself. Only the component modules
you pass in are included in the bundle. There is no lazy loader, dynamic import
or per-tag network waterfall.

## Components

- `<qui-button>` — filled, tonal, elevated, outlined and text variants; anchor mode
- `<qui-icon>` — inline SVG path and viewBox
- `<qui-card>` — elevated, filled and outlined; named `title` / `description` / `actions` slots
- `<qui-checkbox>` — checked, indeterminate, disabled, required, `checkedchange`
- `<qui-switch>` — checked, disabled, required, `checkedchange`
- `<qui-radio-group>` + `<qui-radio>` — orientation, disabled, required, `valuechange`
- `<qui-field>` + label, helper text, error text and required indicator parts
- `<qui-input>` — text/email/tel/search/password/number, masks, text case,
  prefix/suffix slots, number stepping, password visibility, `valuechange`
- `<qui-textarea>` — multi-line text, auto-growth, character counter, native
  resize modes, `valuechange`
- `<qui-accordion>` + item, trigger and content parts
- `<qui-tabs>` + tab list, tab trigger and tab panel parts
- `<qui-dialog>` + trigger, content, title, description, actions and close parts
- `<qui-select>` and `<qui-combobox>` — child `qui-option` data sources or `items`
  properties; measured virtualized rows in a native popover
- `<qui-popover>` — native popover positioned with JavaScript

### Icons

`qui-icon` renders inline SVG from a path and viewBox, so no icon font is
required:

```html
<qui-button>
    <qui-icon label="Add" view-box="0 0 24 24" path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
    Add item
</qui-button>
```

`view-box` defaults to `0 0 24 24`. Material Symbols paths use
`view-box="0 -960 960 960"`. Omit `label` for a decorative icon; provide it to
expose an accessible name. The icon inherits `font-size` and `color`. Its host
uses `display: contents`; style the icon box through `qui-icon::part(icon)`.
Any icon element can be used in a qui slot, so other icon packages work too.

## Field composition

`qui-field` owns IDs, label wiring, validation and disabled/read-only state.
Descendant controls consume the field through a DOM context.

```html
<qui-field id="email" required>
    <qui-field-label>Email</qui-field-label>
    <qui-input input-type="email" placeholder="you@example.com"></qui-input>
    <qui-field-helper-text>We never share it.</qui-field-helper-text>
</qui-field>
```

Use one field per control.

## Forms

Checkbox, switch, radio group, input, textarea, select and combobox are
form-associated custom elements. They support:

- form values and reset
- `required`, `invalid`, `disabled` and `readOnly`
- `qui-field` inheritance
- state restoration
- native form validation hooks

Register every tag used by the form. For a field with an input:

```ts
defineComponents(defineField, defineFieldLabel, defineFieldHelperText, defineInput);
```

### Input text case

Use `text-case` to normalize the value itself, not just its appearance:

```html
<qui-input text-case="uppercase"></qui-input>
<qui-input text-case="lowercase" input-type="email"></qui-input>
<qui-input text-case="uppercase" mask-pattern="aa-####"></qui-input>
```

Casing runs before masking, so mask literals keep their authored case and the
formatted value, the unmasked value and form submission all use the normalized
case. For example, `ab1234` becomes `AB-1234` with the masked example above.
`text-case` is ignored for `number` inputs.

`autocapitalize` on the inner input is derived from `text-case`: `characters`
for uppercase and `none` for lowercase. Set `autocapitalize-hint` to override
that hint, e.g. `autocapitalize-hint="words"`.

If you only need display casing and want to preserve the original form value, use
CSS instead:

```css
qui-input::part(input) {
    text-transform: uppercase;
}
```

### Long text

Use `qui-textarea` for multi-line values. It shares the field, form and validation
behavior of `qui-input`.

```html
<qui-field id="bio">
    <qui-field-label>Bio</qui-field-label>
    <qui-textarea
        rows="5"
        max-length="500"
        show-count
        resize="auto"
        placeholder="Write a short bio..."
    ></qui-textarea>
    <qui-field-helper-text>Keep it under 500 characters.</qui-field-helper-text>
</qui-field>
```

`resize` accepts `none`, `vertical` (the default) or `auto`. Auto-growth uses
`rows` as the minimum height and optionally caps growth with `max-rows`.
`show-count` renders a character counter; with `max-length` it displays
`current/max`. If `max-rows` is smaller than `rows`, `rows` remains the minimum
height.

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

`@quanttrinh/qui/unplugin` scans JSX/TSX and MDX source for used `qui-*` tags.
For client modules it injects one static registration module per set of
components. It also configures the shared stylesheet used by shadow roots, so
plugin-managed styling works without a separate `data-qui-styles` link. Astro
pages need the explicit registration script described below.

The plugin uses unplugin v3, which is ESM-only and requires Node.js `20.19+`
within Node 20, or `22.12+`. Node 21 is not supported.

```ts
import Qui from "@quanttrinh/qui/unplugin";
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [Qui.vite()],
});
```

Set `styles: false` when the app loads the CSS itself:

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

The virtual styles module keeps an existing marked stylesheet link when one is
present. Otherwise it creates one shared blob URL for the document and shadow
roots. Use `styles: false` when the app provides its own combined PandaCSS
stylesheet and marked document link, or when a strict CSP blocks `blob:`
stylesheets.

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
that injects the component stylesheet into each declarative shadow root.

```ts
import { renderToString } from "@quanttrinh/qui/hydrate";
import { withShadowStylesheet } from "@quanttrinh/qui/ssr";

const { html, diagnostics } = await renderToString(
    markup,
    withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
);
```

This renders real Declarative Shadow DOM and puts one external
`<link rel="stylesheet" href="/assets/qui.css" data-qui-styles>` into every
`qui-*` shadow root. The same stylesheet is loaded in the document for host and
app styling; the browser fetches the URL once.

`markup` should contain the complete component composition. Render nested parts
together so field, tabs, dialog and option context works during SSR.

After hydration, register the same components on the client with
`defineComponents()`. Dynamically created components use the stylesheet URL from
`link[data-qui-styles]`, or call:

```ts
import { setQuiStylesHref } from "@quanttrinh/qui/runtime";

setQuiStylesHref("/assets/qui.css");
```

### Streaming

Stencil also exposes `streamToString()` from the hydrate bundle. It currently
fully renders and buffers the document before yielding a single chunk, so it is
not progressive streaming. `withShadowStylesheet()` works with it, but
`renderToString()` is the better default when diagnostics are needed.

### CSS for SSR

Load `theme.css` and the component/app stylesheet in the document. Shadow roots
receive the same stylesheet through the SSR helper.

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
import { renderToString } from "@quanttrinh/qui/hydrate";
import { withShadowStylesheet } from "@quanttrinh/qui/ssr";

const { html } = await renderToString(
  `<qui-button variant="filled">Save</qui-button>`,
  withShadowStylesheet({ href: stylesUrl }, { fullDocument: false }),
);
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

- `theme.css` — CSS custom properties and light/dark values
- `styles.css` — reset, tokens, recipes and component utilities

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
Panda CSS. Generate one stylesheet and mark its document link:

```html
<link rel="stylesheet" href="/assets/qui-app.css" data-qui-styles />
```

That combined stylesheet is used for the document and every shadow root. To opt
out of sharing app styles with components, load `@quanttrinh/qui/styles.css`
instead and keep the app stylesheet document-only.

Load `theme.css` globally at runtime. Do not adopt it into shadow roots.

Low-level generated exports are also available:

```ts
import { css } from "@quanttrinh/qui/css";
import { flex } from "@quanttrinh/qui/patterns";
```

## Distribution layout

`bun run build:all` produces:

```text
dist/shared/                 custom-elements build
dist/hydrate/shared/         SSR/SSG hydrate module
dist/utilities/              compiled utility modules
dist/unplugin/               bundler plugin
dist/types/                  TypeScript declarations
dist/panda/                  Panda design-system manifest
styled-system/               generated Panda CSS and types
```

Published entry points:

| Entry                        | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `@quanttrinh/qui`            | Components                            |
| `@quanttrinh/qui/shared/*`   | Individual component                  |
| `@quanttrinh/qui/register`   | Static component registration helper  |
| `@quanttrinh/qui/unplugin`   | Auto-registration bundler plugin      |
| `@quanttrinh/qui/hydrate`    | SSR/SSG renderer                      |
| `@quanttrinh/qui/ssr`        | Shadow stylesheet SSR helper          |
| `@quanttrinh/qui/runtime`    | Client stylesheet configuration       |
| `@quanttrinh/qui/theme.css`  | Theme custom properties               |
| `@quanttrinh/qui/styles.css` | Component CSS                         |
| `@quanttrinh/qui/panda/*`    | Panda manifest, preset and build info |
| `@quanttrinh/qui/css`        | Generated Panda CSS helper            |
| `@quanttrinh/qui/patterns`   | Generated Panda patterns              |
| `@quanttrinh/qui/jsx`        | Generated Panda JSX helpers           |
| `@quanttrinh/qui/tokens`     | Generated Panda tokens                |
| `@quanttrinh/qui/helpers`    | Generated Panda helpers               |
| `@quanttrinh/qui/types`      | Generated Panda types                 |

## Development

```sh
bun install
bun run dev          # styles + Stencil dev server
bun run build            # production build + utilities + plugin
bun run build:all        # build, utilities, plugin, and Panda artifacts
bun run build:utilities  # compile src/utilities -> dist/utilities
bun run build:unplugin   # compile src/unplugin -> dist/unplugin
bun run lint
bun run fmt
bun run fmt:check
```

Stencil generates `src/components.d.ts` during a build. On a fresh checkout, run
`bun run build` once before type-checking.

`dev` compiles utilities once before starting the Stencil watch. Re-run
`bun run build:utilities` after editing `src/utilities/**`, and
`bun run build:unplugin` after editing `src/unplugin/**`.

Type-check with the native TypeScript compiler:

```sh
node ./node_modules/@typescript/native/bin/tsc --noEmit
```

### Testing

Tests use `@stencil/vitest` with four projects:

- `*.unit.test.ts` / `*.unit.test.tsx` — Node tests for controllers and helpers
- `*.integration.test.ts` — SSR and hydration tests in real browsers
- `*.browser.test.tsx` — full Chromium DOM, forms, focus and popover suite
- `*.smoke.browser.test.tsx` — Chromium, Firefox and WebKit smoke suite

```sh
bun run test:unit
bun run test:integration
bun run test:browser
bun run test:smoke
bun run test
bun run test:watch
```

The package test scripts set `NODE_ENV=test`, which makes Stencil build the
test lazy loader into `.stencil-test` instead of the `www` demo output. Direct
`stencil-test` invocations need that environment variable set as well.
`vitest-setup.ts` loads that loader and the generated theme/shared styles for
browser tests.

## Implementation notes

- The original Zag integrations have been replaced with local controllers.
- Select and combobox share measured/virtualized option-list controllers.
- Form controls share `FormController` and `CheckableController`.
- Browser-only work is gated with `Build.isServer` / `Build.isBrowser`.
- `build/build-utilities.ts` compiles `src/utilities/**/*.ts` into
  `dist/utilities/`, including declarations and rewritten relative imports.
  `build:all` runs it once after both Stencil builds.
- `build/build-unplugin.ts` compiles `src/unplugin/**/*.ts` into
  `dist/unplugin/` using the same module builder.
- The generated `www` app is the demo/dev server; it is not the published client
  entry point.
