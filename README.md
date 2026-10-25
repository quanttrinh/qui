# @quanttrinh/qui

Material Design 3 web components built with [Stencil](https://stenciljs.com/) and
styled with [PandaCSS](https://panda-css.com/).

The package ships two independent distributions:

- **Shared** — one global component stylesheet
- **Split** — per-component CSS shipped with each component module

Both distributions include client-side custom elements and a Stencil hydrate
module for SSR/SSG.

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

### Shared mode

Load the theme once and the shared component stylesheet once:

```ts
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/styles.css";
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

### Split mode

Use the split hydrate/component paths and per-component CSS:

```ts
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/base.css";
import "@quanttrinh/qui/split/components/qui-button.css";
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as defineButton } from "@quanttrinh/qui/split/qui-button";

defineComponents(defineButton);
```

Do not mix shared and split component modules, hydrate modules, or CSS.

## Components

- `<qui-button>` — filled, tonal, elevated, outlined and text variants; anchor mode
- `<qui-icon>` — Material Symbols by name
- `<qui-card>` — elevated, filled and outlined; named `title` / `description` / `actions` slots
- `<qui-checkbox>` — checked, indeterminate, disabled, required, `checkedchange`
- `<qui-switch>` — checked, disabled, required, `checkedchange`
- `<qui-radio-group>` + `<qui-radio>` — orientation, disabled, required, `valuechange`
- `<qui-field>` + label, helper text, error text and required indicator parts
- `<qui-input>` — text/email/tel/search/password/number, masks, text case,
  prefix/suffix slots, number stepping, password visibility, `valuechange`
- `<qui-accordion>` + item, trigger and content parts
- `<qui-tabs>` + tab list, tab trigger and tab panel parts
- `<qui-dialog>` + trigger, content, title, description, actions and close parts
- `<qui-select>` and `<qui-combobox>` — child `qui-option` data sources or `items`
  properties; measured virtualized rows in a native popover
- `<qui-popover>` — native popover positioned with JavaScript

### Icons

Material Symbols is distributed as a font. Install it separately:

```sh
bun add @material-symbols/font-400
```

```ts
import "@material-symbols/font-400/rounded.css";
```

```html
<qui-button>
    <qui-icon name="add"></qui-icon>
    Add item
</qui-button>
```

`qui-icon` inherits `font-size` and `color`. Any icon element can be used in a
qui slot, so other icon packages work too.

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

Checkbox, switch, radio group, input, select and combobox are form-associated
custom elements. They support:

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

Importing `@quanttrinh/qui` or `@quanttrinh/qui/split` directly pulls in the
full component barrel. Use component subpaths when bundle size matters.

## Auto-registration plugin

`@quanttrinh/qui/unplugin` scans JSX/TSX, MDX, and Astro source for used
`qui-*` tags. For client modules it injects one static registration module per
set of components. It also injects the matching styles, so the component modules
and CSS always use the same distribution.

The plugin uses unplugin v3, which is ESM-only and requires Node.js `20.19+`
within Node 20, or `22.12+`. Node 21 is not supported.

```ts
import Qui from "@quanttrinh/qui/unplugin";
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [Qui.vite({ strategy: "shared" })],
});
```

For the split distribution:

```ts
Qui.vite({
    strategy: "split",
    // Set to false if the app loads all CSS itself.
    styles: true,
});
```

The plugin generates static imports, not a loader:

```ts
import { defineComponents } from "@quanttrinh/qui/register";
import { defineCustomElement as __qui_0 } from "@quanttrinh/qui/shared/qui-button";
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/styles.css";

defineComponents(__qui_0);
```

Registering the same component more than once is safe; Stencil checks
`customElements.get()` before defining it.

Tag detection uses Oxc's AST for JavaScript-family files, so tags in strings and
comments are ignored. Astro/MDX use a lexical fallback because they are not
JavaScript. Components created with dynamic tag names or markup assembled at
runtime still need explicit `defineComponents()` registration.

The plugin handles client-side registration. It does not call
`renderToString` and does not perform SSR/SSG. Astro `.astro` page modules run on
the server, so the injected registration is not a browser script. Keep the
explicit registration `<script>` described below for native Astro templates; use
the plugin for JSX/TSX islands or other Vite, Rollup, Webpack, Rspack, and
esbuild entries.

## SSR / SSG

Both distributions ship a Node-compatible Stencil hydrate module.

```ts
// shared mode
import { renderToString } from "@quanttrinh/qui/hydrate";
// split mode
import { renderToString } from "@quanttrinh/qui/hydrate/split";
```

Render components as scoped light DOM:

```ts
const { html, diagnostics } = await renderToString(markup, {
    fullDocument: false,
    serializeShadowRoot: "scoped",
});
```

`markup` should contain the complete component composition. Render nested parts
together so field, tabs, dialog and option context works during SSR.

After hydration, register the same components on the client with
`defineComponents()`.

### CSS for SSR

- **Shared mode:** load `theme.css` and `styles.css`
- **Split mode:** load `theme.css` and `base.css`, plus the per-component CSS
  files for components on the page

With `fullDocument: true`, Stencil includes split component styles in the
generated document head. With `fullDocument: false`, those styles are not
included, so the page must load them.

The custom elements build uses `externalRuntime: false`. Stencil's external
client runtime is compiled with `hydrateClientSide: false`; inlining the runtime
enables the hydrate path for the custom elements build. Without it, server
markup is treated as slot content and the rendered DOM is duplicated on upgrade.

### Astro

Astro can render the hydrate output with `set:html`:

```astro
---
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/styles.css";
import { renderToString } from "@quanttrinh/qui/hydrate";

const { html } = await renderToString(
  `<qui-button variant="filled">Save</qui-button>`,
  { fullDocument: false, serializeShadowRoot: "scoped" },
);
---

<Fragment set:html={html} />

<script>
  import { defineComponents } from "@quanttrinh/qui/register";
  import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
  defineComponents(defineButton);
</script>
```

Astro emits the client entry at the end of `<body>`. To avoid waiting for CSS
before discovering it, add a `modulepreload` for the entry script in the head.
The Astro app should also preserve Stencil's hydration annotations; do not strip
comments from the rendered markup.

## Styling

### Shared strategy

```sh
bun run build
```

- `theme.css` — CSS custom properties and light/dark values
- `styles.css` — reset, tokens, recipes and component utilities
- Per-component CSS files are empty placeholders

### Split strategy

```sh
bun run build:split
```

- `theme.css` — CSS custom properties and light/dark values
- `base.css` — reset, used tokens and global styles
- `split/components/*.css` — one stylesheet per component

Both builds use the same source and public entry points.

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
Panda CSS. It lets Astro and the web components generate into the same
stylesheet instead of loading two overlapping CSS bundles.

Load `theme.css` globally at runtime. Do not adopt it into shadow roots.

Low-level generated exports are also available:

```ts
import { css } from "@quanttrinh/qui/css";
import { flex } from "@quanttrinh/qui/patterns";
```

## Distribution layout

`bun run build:all` produces:

```text
dist/shared/                 shared custom-elements build
dist/split/                  split custom-elements build
dist/hydrate/shared/         shared SSR/SSG hydrate module
dist/hydrate/split/          split SSR/SSG hydrate module
dist/utilities/              compiled utility modules
dist/unplugin/               bundler plugin
dist/types/                  TypeScript declarations
dist/panda/                  Panda design-system manifest
styled-system/               generated Panda CSS and types
```

Published entry points:

| Entry                                    | Purpose                               |
| ---------------------------------------- | ------------------------------------- |
| `@quanttrinh/qui`                        | Shared components                     |
| `@quanttrinh/qui/split`                  | Split components                      |
| `@quanttrinh/qui/shared/*`               | Individual shared component           |
| `@quanttrinh/qui/split/*`                | Individual split component            |
| `@quanttrinh/qui/register`               | Static component registration helper  |
| `@quanttrinh/qui/unplugin`               | Auto-registration bundler plugin      |
| `@quanttrinh/qui/hydrate`                | Shared SSR/SSG renderer               |
| `@quanttrinh/qui/hydrate/split`          | Split SSR/SSG renderer                |
| `@quanttrinh/qui/theme.css`              | Theme custom properties               |
| `@quanttrinh/qui/styles.css`             | Shared component CSS                  |
| `@quanttrinh/qui/base.css`               | Split base CSS                        |
| `@quanttrinh/qui/split/components/*.css` | Split component CSS                   |
| `@quanttrinh/qui/panda/*`                | Panda manifest, preset and build info |
| `@quanttrinh/qui/css`                    | Generated Panda CSS helper            |
| `@quanttrinh/qui/patterns`               | Generated Panda patterns              |
| `@quanttrinh/qui/jsx`                    | Generated Panda JSX helpers           |
| `@quanttrinh/qui/tokens`                 | Generated Panda tokens                |
| `@quanttrinh/qui/helpers`                | Generated Panda helpers               |
| `@quanttrinh/qui/types`                  | Generated Panda types                 |

## Development

```sh
bun install
bun run dev          # shared styles + Stencil dev server
bun run dev:split    # split styles + Stencil dev server
bun run build            # shared production build + utilities + plugin
bun run build:split      # split production build + utilities + plugin
bun run build:all        # both builds, utilities, plugin, and Panda artifacts
bun run build:utilities  # compile src/utilities -> dist/utilities
bun run build:unplugin   # compile src/unplugin -> dist/unplugin
bun run lint
bun run fmt
bun run fmt:check
```

Stencil generates `src/components.d.ts` during a build. On a fresh checkout, run
`bun run build` once before type-checking.

`dev` and `dev:split` compile utilities once before starting the Stencil watch.
Re-run `bun run build:utilities` after editing `src/utilities/**`, and
`bun run build:unplugin` after editing `src/unplugin/**`.

Type-check with the native TypeScript compiler:

```sh
node ./node_modules/@typescript/native/bin/tsc --noEmit
```

### Testing

Tests use `@stencil/vitest` with two projects:

- `*.unit.test.ts` / `*.unit.test.tsx` — Node tests for controllers and helpers
- `*.browser.test.tsx` — real Chromium tests for DOM, forms, focus, popovers and
  virtualized rows

```sh
bun run test:unit
bun run test:browser
bun run test
bun run test:watch
```

`stencil-test` builds the `www` lazy loader before running Vitest.
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
