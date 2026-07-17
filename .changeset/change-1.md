---
"@quanttrinh/solid-md3": minor
---

- **SideNav**: Added responsive mobile overlay via CSS `max-sm:` prefixes. Added `SideNavShellContext` for AppShell–SideNav state coordination. Implemented overflow measurement with `ResizeObserver` and `createEffect`-based row height caching. Extracted `sideNavVariants` cva, `SideNavSectionMenu`, `SideNavOverflow`, and `SideNavSectionTrigger` components. Added `createHoverMenu` hook for pointer-type-aware hover-open behavior (desktop hover opens, mobile tap toggles). Replaced raw `<Menu.Trigger>` with library `<Button>` via `asChild`.
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
