---
"@quanttrinh/qui": minor
---

Overhaul the package with local controllers, SSR/SSG hydration, per-component
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
