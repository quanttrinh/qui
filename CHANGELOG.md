# @quanttrinh/qui

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
