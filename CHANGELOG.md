# @quanttrinh/qui

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
