---
"@quanttrinh/solid-md3": patch
---

Fix all lint warnings in the package.

Rename `src/hooks/create-hover-menu.ts` to `src/hooks/createHoverMenu.ts`, remove a stray `console.log` in the hover-menu hook, and add explicit return types plus `Readonly` parameter types.

Refactor `SideNav` to merge duplicated `@ark-ui/solid/menu` imports, initialize refs, avoid `no-use-before-define` by hoisting shared helpers, and reduce the complexity of the overflow `measure` function by extracting the cutoff computation into a `computeCutoffIndex` helper that takes a single options object.

Re-export toast types directly from `@ark-ui/solid/toast` and convert `ToasterProps` to an interface.

Disable the stylistic `eslint/one-var` and `oxc/no-rest-spread-properties` rules, which conflict with the project's formatting conventions.
