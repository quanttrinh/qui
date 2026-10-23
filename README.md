# @quanttrinh/qui

Stencil web components with Material Design 3 styling via PandaCSS.

This is a port of the earlier Solid implementation. It supports a shared Panda
stylesheet or per-component stylesheets, selected at build time.

## Components

- `<qui-button>` — variants, sizes, disabled, anchor mode
- `<qui-icon>` — any Material Symbols name via the icon font; use `font-size` and
  `color` to size/color it
- `<qui-card>` — elevated/filled/outlined, named `title`/`description`/`actions` slots
- `<qui-checkbox>` — checked/indeterminate, disabled, required, `checkedchange`
- `<qui-switch>` — checked, disabled, required, `checkedchange`
- `<qui-radio-group>` + `<qui-radio>` — orientation, disabled, required, `valuechange`
- `<qui-field>` + `<qui-field-label>`, `<qui-field-helper-text>`,
  `<qui-field-error-text>`, `<qui-field-required-indicator>`
- `<qui-input>` — text/email/tel/search/password/number, masks, prefix/suffix slots,
  number stepping, password toggle, `valuechange`
- `<qui-accordion>` + `<qui-accordion-item>`, `<qui-accordion-trigger>`,
  `<qui-accordion-content>` — multi/collapsible accordion
- `<qui-tabs>` + `<qui-tab-list>`, `<qui-tab-trigger>`, `<qui-tab-panel>` — primary/secondary,
  horizontal/vertical tabs
- `<qui-dialog>` + trigger/content/title/description/actions/close parts, backed by
  the native `<dialog>` element
- `<qui-select>` and `<qui-combobox>` — child `qui-option` data sources or a
  `collection` property; `content-visibility` row virtualization; field integration

### Icons

Material Symbols is distributed as a font (and raw SVG files), not as per-icon JS
modules, so there is nothing like `import { Add } from "material-symbols"`. Import
the font once and use any icon by name:

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

<qui-button icon-only aria-label="Remove">
    <qui-icon name="remove"></qui-icon>
</qui-button>
```

```html
<qui-input placeholder="Search">
    <qui-icon slot="prefix" name="search"></qui-icon>
</qui-input>
```

`qui-icon` inherits `font-size` and `color`, so size it with CSS:

```css
qui-icon {
    font-size: 20px;
}
```

Any element in a qui slot can be an icon, so an app-wide icon package (for example
`iconify-icon`) works too. The inline icons in
`src/components/qui-icon/icons.ts` are only the ones qui's own components need.

### Field composition

```html
<qui-field id="email" required>
    <qui-field-label>Email</qui-field-label>
    <qui-input input-type="email" placeholder="you@example.com"></qui-input>
    <qui-field-helper-text>We never share it.</qui-field-helper-text>
</qui-field>
```

`qui-field` owns the control ids and state. Descendant `qui-input`, `qui-checkbox`,
`qui-switch`, and `qui-radio-group` consume the field through a DOM context, so they
inherit `disabled`, `invalid`, `readOnly`, and `required` without duplicating props.
A field is intended for one control; use separate fields for separate controls.

### Forms

`qui-input`, `qui-checkbox`, `qui-switch`, `qui-radio-group`, `qui-select`, and
`qui-combobox` are form-associated custom elements. They participate directly in
`FormData`, validation, `<fieldset disabled>`, and `form.reset()`.

```html
<form id="profile">
    <qui-input name="email" value="you@example.com" required></qui-input>
    <qui-checkbox name="newsletter" value="yes" checked></qui-checkbox>
</form>

<qui-input form="profile" name="nickname"></qui-input>
```

`form.reset()` restores each control's initial `value` / `defaultValue`,
`checked` / `defaultChecked`, or radio-group `value` / `defaultValue`. The custom
element itself is the form control; its internal native inputs no longer submit
duplicate values.

`qui-field` is a layout/context wrapper and is not itself form-associated. The
actual control inside it owns form participation.

### Radio group

```html
<qui-radio-group name="plan" value="pro">
    <qui-radio value="free">Free</qui-radio>
    <qui-radio value="pro">Pro</qui-radio>
</qui-radio-group>
```

`value` makes the group controlled; use `default-value` for uncontrolled state.
`orientation="horizontal"` switches the layout; the default is vertical.

## Run

```sh
bun install         # from the repo root
bun run dev         # shared styles + stencil dev server
bun run dev:split   # per-component styles + stencil dev server
bun run build       # shared production build
bun run build:split # per-component production build
bun run build:all   # both builds + Panda design-system artifacts
bun run lint        # oxlint + @stencil/eslint-plugin
bun run fmt         # oxfmt
bun run fmt:check
node ./node_modules/@typescript/native/bin/tsc --noEmit  # TypeScript 7 (src)
```

Stencil generates `src/components.d.ts` during a build. On a fresh checkout, run
`bun run build` (or `bun run dev`) once before type-checking.

`bun run build:all` writes both distributions at once:

- `dist/shared/` — the shared-stylesheet build, exported as `@quanttrinh/qui`
- `dist/split/` — the per-component build, exported as `@quanttrinh/qui/split`
- `dist/panda/` — the design-system manifest, preset, and build info used by
  `designSystem: "@quanttrinh/qui"` in an app's Panda config

Both builds are included in the same npm tarball.

## Style strategies

`MD3_STYLE_STRATEGY` selects how PandaCSS output is packaged:

```sh
MD3_STYLE_STRATEGY=shared bun run build  # default
MD3_STYLE_STRATEGY=split bun run build
```

| Strategy | Global CSS                 | Per-component CSS      |
| -------- | -------------------------- | ---------------------- |
| `shared` | `theme.css` + `styles.css` | empty placeholders     |
| `split`  | `theme.css` + `base.css`   | one file per component |

Both strategies use the same components and `styleUrl` declarations. In shared
mode the per-component files are generated as empty placeholders, so the
per-component path is still valid but contributes no CSS. In split mode Stencil
injects only the styles for the components in use.

For an app that uses many components, import the global styles once:

```html
<link rel="stylesheet" href="node_modules/@quanttrinh/qui/theme.css" />
<link rel="stylesheet" href="node_modules/@quanttrinh/qui/styles.css" />
```

Or with a bundler:

```ts
import "@quanttrinh/qui/theme.css";
import "@quanttrinh/qui/styles.css";
```

For standalone use, load `theme.css` and `base.css` globally, then let Stencil
inject each component's `styleUrl` CSS. If you consume the generated CSS files
directly, load only the component files you need:

```html
<link rel="stylesheet" href="node_modules/@quanttrinh/qui/theme.css" />
<link rel="stylesheet" href="node_modules/@quanttrinh/qui/base.css" />
<!-- one file per component actually used -->
<link rel="stylesheet" href="node_modules/@quanttrinh/qui/split/components/qui-button.css" />
```

`theme.css` must stay global; do not adopt it into shadow roots.

Consume the shared build from the package root and the split build from the
`/split` subpath:

```ts
import { QuiButton } from "@quanttrinh/qui"; // shared stylesheet
import { QuiButton as QuiButtonSplit } from "@quanttrinh/qui/split"; // per-component CSS
```

Per-component subpaths are available too:

```ts
import { QuiButton, defineCustomElement } from "@quanttrinh/qui/split/qui-button";
defineCustomElement();
```

Everything generated by Panda lives under `styled-system/`:

- `styled-system/` — generated code and types; with source transforms enabled, static `css()` calls compile to class strings and the styling runtime is tree-shaken
- `styled-system/theme.css` — `@property` registrations, light defaults, `.dark` overrides
- `styled-system/styles.css` — shared reset, tokens, recipes, and utilities
- `styled-system/base.css` — split mode reset, used tokens, and global styles
- `styled-system/components/*.css` — the last generated strategy
- `styled-system/shared/components/*.css` — shared placeholders
- `styled-system/split/components/*.css` — split per-component CSS (published)
- `styled-system/style-urls/` — generated short aliases for every component's `styleUrl`
- `styled-system/style-strategy.json` — the last generated strategy and component manifest

Style generation lives in `styles.stencil.plugin.ts`. `stencil.config.ts` only
selects the strategy and wires the plugin; it does not generate files. The plugin
runs an initial generation before Stencil reads the project config, then checks a
fingerprint of the style inputs at the start of every watch rebuild and regenerates
when something changed. Unchanged files are not rewritten, which avoids a watch
loop.

Component decorators use the generated alias instead of spelling out the path:

```ts
styleUrl: resolveVar(styleUrls.quiButton),
```

`styles.stencil.plugin.ts` writes `styled-system/style-urls/index.js` and
`index.d.ts`; `#qui-style-url` maps to it in `package.json`. Stencil resolves the
alias at compile time with `resolveVar()`, so the built bundle contains the CSS but
no path or alias.

Stencil copies the selected global stylesheet to the `www` root as `/styles.css`
and copies `theme.css` as `/theme.css`, so the demo loads both in `<head>`.

The Stencil config also enables Panda's Rollup source transform:

```ts
rollupPlugins: {
    before: [...pandacss({ transform: true })],
},
```

Static calls like `css({ display: "flex" })` are rewritten to class strings at
build time, so the `styled-system/css` runtime is removed from the component
bundles. Calls with values that are not statically knowable keep the runtime
fallback as designed by Panda.

## Use with Panda

The package ships a Panda design-system manifest. Apps that run Panda should point
at the package once instead of copying its config or adding it to `include`:

```ts
// panda.config.ts
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    designSystem: "@quanttrinh/qui",
    include: ["./src/**/*.{ts,tsx}"],
    outdir: "styled-system",
});
```

That loads qui's theme, recipes, tokens, and the styles Panda already extracted
from the components. Apps can extend the theme and use their local `css()` or
recipes alongside qui components:

```ts
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    designSystem: "@quanttrinh/qui",
    include: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            tokens: {
                spacing: {
                    18: { value: "4.5rem" },
                },
            },
        },
    },
});
```

```ts
import { css } from "../styled-system/css";
import { QuiButton } from "@quanttrinh/qui";

const toolbar = css({ display: "flex", gap: "18" });

export const Toolbar = () => (
    <div class={toolbar}>
        <QuiButton variant="filled">Save</QuiButton>
    </div>
);
```

If you only need qui tokens without the full design-system manifest, the
`./css`, `./tokens`, and `./types` subpaths are exported as well. `theme.css`
still supplies the runtime `--md-sys-color-*` values; load it globally.

Panda's `panda lib` step runs as part of `bun run build:all` and writes
`dist/panda/{lib.json,preset.mjs,buildinfo.json}`. Do not hand-edit those files or
the generated `./css`, `./recipes`, `./patterns`, `./jsx`, `./tokens`, `./helpers`,
and `./types` exports; `panda lib` owns them. The `"."`, `"./split"`, and CSS
exports are the package's public entry points and are kept on every run.

## Generated code alias

Components import the generated styled-system through a Node subpath import:

```ts
import { css, cx } from "#styled-system/css";
```

This is configured in `package.json` and needs no bundler plugin:

```json
"imports": {
  "#styled-system/css": "./styled-system/css/index.js"
}
```

`tsconfig.json` sets `"rootDir": "."` so TypeScript can resolve the subpath import
from the package root. Stencil rewrites it to a relative path in the emitted output,
so consumers never see the alias.

## Lint / format

- `oxlint.config.ts` — Stencil rules via `@stencil/eslint-plugin` (`jsPlugins`), plus JSX rules.
- `oxfmt.config.ts` — import sorting and package.json ordering.

## Native dialog

`qui-dialog` now uses the native `<dialog>` element. It supports:

- `modal` (default `true`) — `showModal()` vs `show()`
- `open` / `defaultOpen`
- `closeOnEscape`
- `closeOnInteractOutside` — `closedby="any"` where supported
- `preventScroll` — modal scroll lock
- `dialogRole` (`dialog` or `alertdialog`)
- `dialogLabel`
- `show()` / `close(returnValue)` methods
- `openchange` and `dialogcancel` events

Select and Combobox use CSS-native row virtualization (`content-visibility`) with popper
positioning. The
Popover API migration is documented in
[`docs/native-dialog-popover-investigation.md`](docs/native-dialog-popover-investigation.md).

## TypeScript 7

TypeScript 7.0 ships the native `tsc` compiler but **no JavaScript compiler API**.
`@stencil/eslint-plugin` imports the TypeScript API, so it cannot run against the
TypeScript 7 root package directly.

This package uses the official side-by-side setup:

```json
"@typescript/native": "npm:typescript@^7.0.2",
"typescript": "npm:@typescript/typescript6@^6.0.2"
```

- `@typescript/native` is TypeScript 7.0.2 and is the compiler used for type-checking.
- `typescript` is the TypeScript 6 API alias, used only by API-consuming tooling
  (`@stencil/eslint-plugin` via oxlint).

```sh
node ./node_modules/@typescript/native/bin/tsc --noEmit
```

`tsconfig.json` checks `src`:

- `include: ["src"]` — the components
- `rootDir: "."` — lets TypeScript resolve the `#styled-system/*` subpath import
- `types: []` — the components are browser code; `@types/node` is opt-in per file

Root config files (`stencil.config.ts`, `panda*.config.ts`, `oxlint.config.ts`,
`oxfmt.config.ts`) are not part of the `src` program. `stencil.config.ts` starts with
`/// <reference types="node" />` so editors resolve its Node globals, and the other
configs are covered by their own tooling.

oxlint reads rule options by their documented camelCase names (for example
`preferInline`); the generated TypeScript types only declare those names, so the
kebab-case form type-checks as an error even though oxlint also accepts it at
runtime.

If you want `typescript` itself to point at 7.0.2, the Stencil ESLint plugin must
be dropped or moved to a separate TypeScript 6 lint workspace.

## Status / next steps

- [x] Stencil package scaffold
- [x] Panda config + generated theme.css (`@property`)
- [x] Button
- [x] Card
- [x] Checkbox / Switch / RadioGroup (Zag vanilla)
- [x] Field / Input
- [x] Tabs / Accordion
- [x] Dialog / Select / Combobox
- [x] Native `<dialog>` migration
- [ ] Popover API migration for Select/Combobox
- [ ] Theme components
- [x] Split/per-component CSS + compile-time switch
- [ ] unplugin package
