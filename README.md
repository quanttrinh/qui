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
    <qui-icon view-box="0 0 24 24" path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
    Add item
</qui-button>

<qui-button icon-only label="Add">
    <qui-icon view-box="0 0 24 24" path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
</qui-button>
```

`view-box` defaults to `0 0 24 24`. Material Symbols paths use
`view-box="0 -960 960 960"`. Omit `label` for a decorative icon; provide it to
expose an accessible name on the icon box. The icon inherits `font-size` and
`color`. Its host uses `display: contents`; the inner icon box carries the
accessible role and can be styled or resized through
`qui-icon::part(icon)`. Any icon element can be used in a qui slot, so other
icon packages work too.

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
components. It also configures the component stylesheet used by shadow roots.

By default the virtual styles module imports the document-only `theme.css` and
embeds `styles.css` in a shared blob URL. Do not also add the Quick start CSS
imports in that mode, or the shared CSS is emitted twice. Astro pages need the
explicit registration script described below.

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

`href` should be a stable public URL. If Vite emits a hashed or `base`-prefixed
asset URL, mark the generated link yourself. External mode has no runtime
fallback: marked document links are the source of truth, so shadow roots always
use their final URLs.

External `href` mode is Vite/Astro-only because it relies on
`transformIndexHtml`. Other adapters throw; use `styles: false` and mark the
document link yourself there.

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
that injects the component stylesheet into each declarative shadow root.

```ts
import { renderToString } from "@quanttrinh/qui/hydrate";
import { withShadowStylesheet } from "@quanttrinh/qui/ssr";

const { html, diagnostics } = await renderToString(
    markup,
    withShadowStylesheet({ href: "/assets/qui-components.css" }, { fullDocument: false }),
);
```

This renders real Declarative Shadow DOM and puts one external
`<link rel="stylesheet" href="/assets/qui-components.css" data-qui-styles>` into every
styled `qui-*` shadow root. Data-only and host-only roots such as `qui-option`,
`qui-dialog`, and the field helper/error/required parts receive no link because
those components do not request shadow styles. The same stylesheet is loaded in
the document for host and app styling; the browser fetches the URL once.

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

`bun run build:release` produces:

```text
dist/shared/                 custom-elements build
dist/hydrate/                SSR/SSG hydrate module
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
bun run build:release    # release build with Panda artifacts
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
  `build` runs it after Stencil completes.
- `build/build-unplugin.ts` compiles `src/unplugin/**/*.ts` into
  `dist/unplugin/` using the same module builder.
- The generated `www` app is the demo/dev server; it is not the published client
  entry point.
