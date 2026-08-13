# @quanttrinh/solid-md3

## 1.1.0

### Minor Changes

- cbd0119: Add a Vite build pipeline that emits compiled JavaScript and styles (`dist/index.js`, `dist/styles.css`) plus TypeScript declarations, and add a `solid` export condition so Solid apps can compile the component source in their own build. Package entry points now resolve to `dist` instead of `src`.
  
  Make `solid-js` a required peer dependency instead of optional, since it is the library's core runtime.
  
  Update all dev and peer dependencies to their latest versions.

### Patch Changes

- cbd0119: Fix all lint warnings in the package.
  
  Rename `src/hooks/create-hover-menu.ts` to `src/hooks/createHoverMenu.ts`, remove a stray `console.log` in the hover-menu hook, and add explicit return types plus `Readonly` parameter types.
  
  Refactor `SideNav` to merge duplicated `@ark-ui/solid/menu` imports, initialize refs, avoid `no-use-before-define` by hoisting shared helpers, and reduce the complexity of the overflow `measure` function by extracting the cutoff computation into a `computeCutoffIndex` helper that takes a single options object.
  
  Re-export toast types directly from `@ark-ui/solid/toast` and convert `ToasterProps` to an interface.
  
  Disable the stylistic `eslint/one-var` and `oxc/no-rest-spread-properties` rules, which conflict with the project's formatting conventions.

## 1.0.0

### Major Changes

- 5a14653: Remove `ScrollArea` component. Switch to native browser scrolling for `Select` and `Combobox` dropdowns.

### Minor Changes

- cfa4ea6: Add `Toast` component using Ark UI's toast engine with `createToaster`, MD3 variant styling, and responsive layout.

## 0.2.0

### Minor Changes

- 6337e17: - **SideNav**: Added responsive mobile overlay via CSS `max-sm:` prefixes. Added `SideNavShellContext` for AppShell–SideNav state coordination. Implemented overflow measurement with `ResizeObserver` and `createEffect`-based row height caching. Extracted `sideNavVariants` cva, `SideNavSectionMenu`, `SideNavOverflow`, and `SideNavSectionTrigger` components. Added `createHoverMenu` hook for pointer-type-aware hover-open behavior (desktop hover opens, mobile tap toggles). Replaced raw `<Menu.Trigger>` with library `<Button>` via `asChild`.
  - **AppShell**: Added `SideNavShellContext.Provider`, mobile hamburger via `<Button iconOnly variant="text">` with `sm:hidden`, and sticky header bar.
  - **Combobox**: Replaced inline debounce with `@tanstack/solid-pacer` (`createDebouncer`). Added `comboboxVariants` cva with size prop (`sm`/`md`/`lg`). Fixed empty state layout.
  - **NumberInput / Select**: Added size prop with `numberInputVariants` / `selectVariants` cva.
  - **Pagination**: Increased touch targets from `h-9 w-9` to `h-10 w-10`.
  - **Banner**: Renamed cva to `bannerVariants` / `bannerIconVariants`. Added `aria-label="Dismiss"` on close button and `aria-hidden="true"` on icon.
  - **TagsInput**: Added `aria-label` on delete triggers.
  - **Tabs / Accordion**: Removed explicit `duration-200` from indicator transitions.
  - **LoadingSpinner**: Wrapped animations in `motion-safe:` and added custom `pulse-dot` keyframe for animated dots.
  - **Card**: Responsive padding `p-4 sm:p-6`.
  - **EmptyState**: Added `aria-hidden="true"` on icon wrapper.
  - **ScrollArea**: Removed `transition-[width]` from thumb.
  - **Progress**: Moved track classes to `progressVariants` cva. Changed range transition from `transition-all` to `transition-[width]`.
  - **All components**: Renamed all cva definitions to `<Component>Variants` naming convention.
  - Added `@tanstack/solid-pacer` as a peer/optional dependency. Removed `@quanttrinh/ts-helpers`.
