# @quanttrinh/qui

## 0.5.0

### Minor Changes

- 77e024e: Resolve and mark content-hashed component stylesheets, including SSR output.
  
  - Allow `styles.href` to be an async resolver that receives the Vite command, mode, base, HTML path, and build bundle, so content-hashed CSS assets can be marked without hard-coding the hash. The resolver context correctly distinguishes client and SSR builds.
  - Export `resolveStylesheetHrefs` and `markExternalStylesheetLinks` for SSR/SSG pipelines that render HTML outside Vite's `transformIndexHtml`. Resolved URLs include the Vite base, and the public helper validates malformed styles.
  - Cache the normalized configured stylesheet href list, query only `link[data-qui-styles]`, and ignore unrelated link mutations when invalidating discovered stylesheet URLs.
  - Export the `data-qui-styles` attribute and link selector from the runtime so SSR and test helpers share one definition instead of duplicating constants.
  - Widen the plugin peer range to `>=0.4.0 <0.6.0` so both packages remain installable after the minor release.

### Patch Changes

- 751162e: Hide composite component content in the global stylesheet until the custom
  elements are registered, preventing a flash of undefined light-DOM content
  before Stencil injects its hydrated styles.
  
  The rule only targets content that has no usable pre-upgrade state, uses
  `:not(:defined)` so it stops applying after registration, and excludes
  server-rendered hosts carrying Stencil's `hydrated` class. It is `!important`
  while undefined so consumer host `display` styles cannot re-expose the content.
  If the client bundle never loads, the affected content remains hidden.

## 0.4.0

### Minor Changes

- da80998: Split the bundler plugin into `@quanttrinh/qui-unplugin`, add external component stylesheet support, separate the document-only theme from shadow-root CSS, and flatten the hydrate output.
  
  - Add `Qui.vite({ styles: { href } })` for an existing app/component stylesheet without a blob URL. Vite marks a matching document link and applies its configured base. External mode is Vite-only and uses marked document links as the source of truth.
  - External styles do not import `theme.css` by default. Use `styles: { href, theme: true }` when the plugin should load the library theme.
  - Generate `theme.css` directly from the theme source. It is document-only, contains custom properties and `@property` registrations, has no `:host` fallback, and establishes canonical layer order.
  - Replace the root layer order declaration in generated `styles.css` with individual declarations so Panda does not re-expand dependency CSS.
  - Move the plugin to `packages/unplugin` as `@quanttrinh/qui-unplugin` with a compatible main-package peer range (`>=0.3.1 <0.5.0`). `@quanttrinh/qui/unplugin` is removed; install the plugin package and import it directly.
  - Move `@quanttrinh/qui` into `packages/qui` and make the repository root a private workspace.
  - Flatten the hydrate build output to `dist/hydrate/`.
  - Make the published runtime self-contained by inlining the DOM element check.
  
  This repository treats a minor release of a `0.x` package as the breaking-change signal.

## 0.3.1

### Patch Changes

- 440ec05: Expose Stencil's global HTML element declarations from the package root.
  
  Importing `@quanttrinh/qui` now loads `HTMLQui*Element` types and the
  `Components` namespace, so consumers no longer need to define custom
  `HTMLElement & { ... }` intersections for component elements. Shared component
  subpaths now also declare their `.d.ts` entry explicitly.

## 0.3.0

### Minor Changes

- 98b1d44: Add an accessible label for icon-only buttons.
  
  `qui-button` now accepts `label`, which is applied to the internal button or
  anchor. This gives icon-only controls a name that is exposed through the
  accessibility tree without adding visible text.
- 98b1d44: Improve cross-shadow-root accessibility wiring.
  
  - Target host elements for ARIA relationships instead of internal elements in
    sibling shadow roots.
  - Add shared context registries so field, accordion, tabs, dialog, and radio
    parts reconnect correctly after upgrades or re-renders.
  - Wire dialog titles/descriptions and tab/accordion trigger/content
    relationships across shadow boundaries.
  - Clear stale ARIA relationships when a related part is removed.
  - Keep textarea counter descriptions in sync when the counter is toggled.
  - Use ARIA element reflection for cross-shadow-root relationships; IDREF
    fallback remains for same-tree relationships.
- 98b1d44: Rename the public form-control focus method to `focusControl()`.
  
  `qui-input`, `qui-textarea`, `qui-select`, `qui-combobox`, `qui-checkbox`,
  `qui-switch`, and `qui-radio-group` expose `focusControl(options?)` instead of
  `focus(options?)`. This avoids colliding with the reserved
  `HTMLElement.focus()` method and makes the shadow-DOM focus target explicit.
  
  ```ts
  await input.focusControl();
  await select.focusControl({ preventScroll: true });
  ```
- 98b1d44: Split host layout from component visual styling.
  
  Host elements now use the document stylesheet only for layout, primarily
  `display`. Visual styles live on an internal `part="root"` element owned by the
  component shadow root.
  
  ```css
  qui-card {
    width: 100%;
    margin-block: 2rem;
  }
  
  qui-card::part(root) {
    background: white;
    padding: 2rem;
  }
  ```
  
  `qui-icon` exposes its visual box through `::part(icon)`. Tab triggers and
  panels use `display: contents` so their internal controls remain the layout
  items.
- 98b1d44: Render `qui-icon` from inline SVG instead of the Material Symbols font.
  
  `qui-icon` now accepts `path` and `viewBox` instead of `name`:
  
  ```html
  <qui-icon
    view-box="0 0 24 24"
    path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"
  ></qui-icon>
  ```
  
  The Material Symbols font is no longer required. `viewBox` defaults to
  `0 0 24 24`; Material Symbols paths can use `view-box="0 -960 960 960"`.
- 98b1d44: Remove the split CSS distribution.
  
  The package now ships a single shared component stylesheet. The `split`
  component entry points, `hydrate/split`, `base.css`, `split.css`, per-component
  split CSS, and the unplugin `strategy` option are removed.
  
  Consumers should use `@quanttrinh/qui/shared/*`, `@quanttrinh/qui/hydrate`,
  `theme.css`, and `styles.css`.
- 98b1d44: Add the `@quanttrinh/qui/runtime` stylesheet helpers.
  
  - `setQuiStylesHref()` configures one or more stylesheet URLs and updates
    existing shadow roots and marked document links.
  - `getQuiStylesHref()` returns the configured URL or the document
    `link[data-qui-styles]` fallback.
  - `ensureShadowStylesheet()` adds or reconciles the managed stylesheet link in a
    component shadow root.
  
  Calling `setQuiStylesHref([])` explicitly removes managed links and disables the
  document-link fallback. `resetQuiStylesHref()` clears the configuration for HMR
  and teardown flows. Document signposting is cached and invalidated when stylesheet links change, and
  data-only/host-only roots are skipped. These helpers support dynamically created
  components and SSR hydration without duplicating CSS in JavaScript.
- 98b1d44: Migrate all components to Shadow DOM.
  
  Every `qui-*` component now renders into an open shadow root. Internal DOM is
  no longer part of the light DOM, so consumers must use public `part` hooks or
  the component API instead of querying internal elements.
  
  - Remove the `innerClass` escape hatch. Use `::part(...)`, design tokens, or
    public props for customization.
  - Add missing `part="root"` hooks to card, input, and textarea.
  - Replace light-DOM internals in tests and examples with shadow-aware queries.
- 98b1d44: Add the `@quanttrinh/qui/ssr` entry point.
  
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
  hydration document. Components that request shadow styles mark their host during
  SSR; data-only and host-only roots such as `qui-option`, `qui-dialog`, and the
  field helper/error/required parts receive no link. The README documents that
  cross-root ARIA wiring starts after hydration.
- 98b1d44: Make the unplugin configure shadow-root styles automatically.
  
  The generated `virtual:qui/styles` module now preserves an existing marked app
  stylesheet. When no stylesheet is configured, it creates one shared URL for the
  document and shadow roots instead of requiring a manual
  `link[data-qui-styles]`.
  
  Registration output is sorted alphabetically. Context parts retry when a
  provider is defined or upgraded later, so the plugin no longer maintains a
  separate provider-priority table. Use `styles: false` to keep full control of
  the combined app stylesheet or when a strict CSP blocks `blob:` stylesheets. HMR disposal removes the generated link
  and clears the runtime URL before the next module instance loads.

### Patch Changes

- 98b1d44: Expand browser coverage for the Shadow DOM release.
  
  - Run SSR/hydration smoke tests in Chromium, Firefox, and WebKit.
  - Assert Chromium accessibility-tree output and cross-browser role/name lookup
    for buttons, labelled icons, and icon-only buttons.
  - Cover tabs and accordion relationships in the cross-browser smoke suite,
    accepting either ARIA element reflection or the IDREF fallback.
  - Verify declarative shadow DOM styling, link retention, and hydration without
    fixed timing sleeps.
- 98b1d44: Make dialog scroll locking reference-counted.
  
  Multiple open modal dialogs now share a lock count, and scrolling is restored
  only when the last modal dialog closes or disconnects. Changing `modal` or
  `preventScroll` while a dialog is open also updates the native modality,
  document listeners, and scroll lock state. Queued close events from the
  modality switch are ignored once the dialog has reopened, and scroll locking is
  restored when an open dialog reconnects.
- 98b1d44: Activate checkable controls from field labels.
  
  Clicking a `qui-field-label` now focuses the registered control and activates
  checkable controls, so labels inside a field toggle checkboxes and switches.
  Text-like controls and select/combobox triggers are only focused; their menus
  are not opened by a label click. Disabled fields ignore label activation, and
  clicking an interactive element inside the label targets that element instead
  of the field control.
- 98b1d44: Allow form controls to update controlled properties during form reset and state restoration.
  
  `qui-input`, `qui-textarea`, `qui-radio-group`, `qui-checkbox`, and `qui-switch` now declare their internally updated `value` or `checked` prop as mutable. This removes Stencil mutability warnings without changing their public API.
- 98b1d44: Keep test-only declarations out of published types.
  
  `dist/types` no longer contains declarations for tests, test utilities, or
  Vitest setup. Stencil now uses a build-only `tsconfig.build.json`.
- 98b1d44: Share one Panda driver across stylesheet generation and source transforms.
  
  - Reuse a single main Panda compiler for `styles.css` and
    `@pandacss/transformer`.
  - Generate `theme.css` with a dedicated theme driver.
  - Keep the synchronous codegen bootstrap required by Stencil, then use the
    shared driver for CSS and watch updates.
  - Remove the unused Panda Rollup CSS asset and repeated `panda cssgen`
    subprocesses.
- 98b1d44: Separate test builds from demo and package outputs.
  
  - Exclude test files, test utilities, and Vitest configuration from Stencil
    builds and dev watch.
  - Build the test lazy loader into `.stencil-test` only when
    `NODE_ENV=test`.
  - Keep the `www` output for the demo and development server only.
  - Split integration, browser, and smoke tests into dedicated Vitest projects and
    declare Playwright directly.
- 98b1d44: Document the SSR streaming behavior.
  
  Stencil's `streamToString()` currently fully renders and buffers the document
  before yielding a single chunk. `withShadowStylesheet()` works with that API,
  but `renderToString()` remains the recommended path when diagnostics are
  needed. Added coverage for the buffered streaming path.
- 98b1d44: Harden tabs and accordion ARIA and keyboard behavior.
  
  - Clear stale `aria-controls` and `aria-labelledby` relationships when related
    parts are removed.
  - Order roving focus by document position instead of registration order.
  - Avoid redundant blur updates when focus moves between triggers.
  - Account for focusable descendants inside nested shadow roots before adding a
    tab panel to the tab order.
  - Recalculate panel tab stops after render and again after the first paint, so
    nested custom elements can attach their shadow roots without a transient tab
    stop or Stencil state-during-render warnings.
- 98b1d44: Fix unplugin source injection for MDX and Astro.
  
  - Inject the virtual registration import after MDX frontmatter, including empty,
    CRLF, trailing-whitespace, and end-of-file frontmatter blocks.
  - Leave Astro pages untouched; use the explicit registration script for native
    Astro templates.

## 0.2.1

### Patch Changes

- fc18cef: Render a required indicator for required checkboxes.
  
  `qui-checkbox` now shows the same red `*` marker as field labels when
  `required` is set directly or inherited from a wrapping `qui-field`. The
  indicator is hidden otherwise and is exposed through the `required-indicator`
  part for styling.
- a60c063: Avoid collisions with the native `Element.part` property.
  
  The context-part controllers were stored in a field named `part`. The field
  helper text, error text, and required indicator render a `part` attribute on
  their host element, which shadows that field with the native `DOMTokenList`.
  Component lifecycle hooks then failed with
  `this.part.hostDidLoad is not a function`.
  
  Rename the internal controller to `contextPart` across all context-part
  components for consistency and to prevent future host-attribute collisions.

## 0.2.0

### Minor Changes

- a24b411: Add case normalization to `qui-input`.
  
  - Add the `textCase` property with `none`, `uppercase`, and `lowercase` modes.
  - Normalize initial, controlled, typed, and pasted values before masking, so
    form values and `valuechange` details use the same case.
  - Preserve the caret when case mapping changes the value length.
  - Re-apply masks from the raw value so changing `textCase` or the mask does not
    consume literal digits or letters.
  - Only restore the caret for input types that support the selection API.
  - Set the inner input's native `autocapitalize` hint from `textCase`, with an
    `autocapitalizeHint` override. `number` inputs do not derive a hint from
    `textCase`.
  - Document CSS `::part(input)` for display-only casing that should not change
    the submitted value.
- a515e79: Add `qui-textarea`.
  
  - Multi-line form-associated text control with `value`, `defaultValue`, validation,
    reset, and state restoration.
  - Inherits `qui-field` ids, labels, helper text, error text, and disabled,
    read-only, required, and invalid state.
  - Supports `rows`, native `resize="vertical"`, `resize="none"`, and auto-growth
    with `resize="auto"` plus an optional `maxRows` cap.
  - Adds an optional character counter with `showCount`, including `current/max`
    when `maxLength` is set.
  - Emits `valuechange` with the current value.

### Patch Changes

- febc83d: Simplify context part lifecycles.
  
  - Add a shared `consumeContextPart` helper for attach, retry, subscription, and
    teardown handling.
  - Migrate the accordion, tabs, dialog, field, and radio parts to the helper.
  - Remove unused accordion context members and centralize item disabled state.
- febc83d: Fix context parts that failed to attach when custom elements were registered child-first.
  
  - Sort unplugin registrations so context providers are defined before the parts
    that consume them.
  - Notify waiting parts when a provider registers, so accordion, tabs, dialog,
    field, and radio parts attach regardless of custom element definition order.
- 6c314f6: Align inline icon SVGs with Material Symbols Rounded.
  
  - Replace the classic Material Icons paths for `check`, `remove`, `add`,
    `visibility`, `expand_more`, and `unfold_more` with the official Material
    Symbols Rounded geometry.
  - Update `visibility_off` to the current Google Fonts rounded path.
  - Render every inline icon from the shared `0 -960 960 960` Material Symbols
    canvas so they visually match the `qui-icon` font.

## 0.1.0

### Minor Changes

- 90ae75a: Overhaul the package with local controllers, SSR/SSG hydration, per-component
  registration, and an auto-registration unplugin.
  
  - Replace the Zag integrations for checkbox, switch, radio group, tabs, and
    accordion with local controllers.
  - Ship shared and split hydrate modules at `@quanttrinh/qui/hydrate` and
    `@quanttrinh/qui/hydrate/split`.
  - Inline the Stencil client runtime in the custom-elements build
    (`externalRuntime: false`) so server-rendered markup hydrates without being
    duplicated.
  - Add `@quanttrinh/qui/register` with static `defineComponents()` registration.
  - Add `@quanttrinh/qui/unplugin` for Vite, Rollup, Webpack, Rspack, and esbuild.
    It uses Oxc's AST to find used `qui-*` tags, ignores tags in strings and
    comments, falls back to lexical scanning for Astro/MDX, and injects static
    shared or split registration and CSS.
  - Make form, field, option, dialog, and popover internals SSR-safe by gating
    browser-only work with `Build.isServer` / `Build.isBrowser` and using
    tag-based DOM guards instead of concrete element constructors.
  - Rename the build environment variable from `MD3_STYLE_STRATEGY` to
    `STYLE_STRATEGY`, and add standalone builds for utilities and the unplugin.
  - Add unit and browser Vitest coverage and run both in CI with cached Playwright
    Chromium.
  - Rewrite the README around the shared/split distributions, hydration,
    registration, the unplugin, and testing.
  
  The shared build exports remain at `@quanttrinh/qui` and
  `@quanttrinh/qui/shared/*`; the split build remains at `@quanttrinh/qui/split`
  and `@quanttrinh/qui/split/*`.
- 09cc6b1: Speed up auto-registration discovery.
  
  - Skip AST parsing for modules that cannot contain a static `qui-*` tag.
  - Use unplugin v3 hook filters so unrelated modules, virtual modules, and
    dependencies never reach the resolve, load, or transform handlers.
  - Cache component extraction per module and invalidate it when the source
    changes.
  - Emit boundary-resolution source maps without embedded source content.
  - Traverse the Oxc AST iteratively to avoid deep recursion on large modules.
- 09cc6b1: Upgrade the auto-registration plugin to `unplugin` v3.
  
  - Update `unplugin` from `^2.3.11` to `^3.4.0`.
  - Require Node.js `^20.19.0 || >=22.12.0`, matching unplugin v3's ESM-only
    support matrix.
  - Keep AST extraction on Oxc; the plugin does not use unplugin's optional
    `this.parse` helper, so v3's removal of the bundled Acorn parser does not
    change tag detection.
