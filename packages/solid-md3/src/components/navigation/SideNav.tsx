import { Menu, MenuRootBaseProps } from "@ark-ui/solid/menu";
import ChevronLeft from "@iconify-solid/material-symbols/chevron-left";
import ChevronRight from "@iconify-solid/material-symbols/chevron-right";
import MoreHoriz from "@iconify-solid/material-symbols/more-horiz";
import { cva } from "class-variance-authority";
import {
  For,
  type JSX,
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
  useContext,
} from "solid-js";
import { Dynamic, Portal } from "solid-js/web";

import { cn } from "../../cn";
import { createHoverMenu } from "../../hooks/create-hover-menu";
import { Button } from "../buttons/Button";

export interface SideNavShellContextValue {
  open: () => boolean;
  setOpen: (value: boolean) => void;
}

export const SideNavShellContext = createContext<SideNavShellContextValue>();

export function useSideNavShell(): SideNavShellContextValue | undefined {
  return useContext(SideNavShellContext);
}

interface SideNavItemData {
  type: "item";
  href: string;
  icon?: () => JSX.Element;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

interface SideNavSectionData {
  type: "section";
  icon?: () => JSX.Element;
  label: string;
  disabled?: boolean;
  children: SideNavItemData[];
}

type SideNavEntry = SideNavItemData | SideNavSectionData;

function isSection(e: SideNavEntry): e is SideNavSectionData {
  return "type" in e && e.type === "section";
}

interface SideNavLinkProps {
  href: string;
  children: JSX.Element;
  class?: string;
  "aria-current"?: "page" | undefined;
  "aria-disabled"?: boolean | undefined;
}

type RenderLink = (item: SideNavItemData, props: SideNavLinkProps) => JSX.Element;

function SideNavLink(
  props: Readonly<
    {
      item: SideNavItemData;
      class: string;
      isLeft: boolean;
      renderLink?: RenderLink;
    } & JSX.HTMLAttributes<HTMLElement>
  >,
): JSX.Element {
  const [local, rest] = splitProps(props, ["item", "class", "isLeft", "renderLink"]);

  return (
    <Dynamic
      {...rest}
      component={
        local.renderLink
          ? (linkProps: SideNavLinkProps) => local.renderLink?.(local.item, linkProps)
          : ("a" as const)
      }
      href={local.item.href}
      class={cn(local.class)}
      aria-current={local.item.active ? "page" : undefined}
      aria-disabled={local.item.disabled ? true : undefined}
    >
      {local.item.icon?.()}
      <span class={cn("truncate", !local.isLeft && "text-right")}>{local.item.label}</span>
    </Dynamic>
  );
}

function SideNavSectionTriggerContent(
  props: Readonly<{ section: SideNavSectionData; isLeft: () => boolean }>,
): JSX.Element {
  return (
    <>
      {props.section.icon?.()}
      <span class={cn("flex-1 truncate", !props.isLeft() && "text-right")}>
        {props.section.label}
      </span>
      <Show when={props.isLeft()} fallback={<ChevronLeft class="text-xl" />}>
        <ChevronRight class="text-xl" />
      </Show>
    </>
  );
}

function SideNavMenuItem(
  props: Readonly<{
    item: SideNavItemData;
    isLeft: () => boolean;
    renderLink?: RenderLink;
  }>,
): JSX.Element {
  return (
    <Menu.Item
      value={props.item.href}
      disabled={props.item.disabled}
      closeOnSelect
      asChild={(menuProps) => {
        const [local, rest] = splitProps(menuProps(), ["class", "children"]);
        return (
          <SideNavLink
            {...rest}
            item={props.item}
            class={cn(
              "state-layer flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-md3-on-surface-variant no-underline transition-colors",
              "hover:bg-md3-surface-container-high hover:text-md3-on-surface",
              props.item.disabled && "pointer-events-none opacity-38",
              local.class,
            )}
            isLeft={props.isLeft()}
            renderLink={props.renderLink}
          />
        );
      }}
    />
  );
}

function SideNavSectionMenuContent(
  props: Readonly<{
    section: SideNavSectionData;
    menuContentClass: string;
    isLeft: () => boolean;
    renderLink?: RenderLink;
    onContentMouseEnter?: () => void;
    onContentMouseLeave?: () => void;
  }>,
): JSX.Element {
  return (
    <Portal>
      <Menu.Positioner>
        <Menu.Content
          class={props.menuContentClass}
          onMouseEnter={props.onContentMouseEnter}
          onMouseLeave={props.onContentMouseLeave}
        >
          <For each={props.section.children}>
            {(child) => (
              <SideNavMenuItem item={child} isLeft={props.isLeft} renderLink={props.renderLink} />
            )}
          </For>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  );
}

function SideNavSectionMenu(
  props: Readonly<{
    entry: SideNavSectionData;
    hidden: () => boolean;
    isLeft: () => boolean;
    renderLink?: RenderLink;
  }>,
) {
  const hover = createHoverMenu();
  let buttonRef: HTMLButtonElement | undefined;

  return (
    <Menu.Root
      {...getMenuRootProps(props.isLeft(), { getAnchorElement: () => buttonRef ?? null })}
      open={hover.hoverOpen()}
      onOpenChange={hover.onOpenChange}
      onPointerDownOutside={hover.blockClick}
    >
      <Button
        ref={buttonRef}
        disabled={props.entry.disabled === true || props.hidden()}
        onClick={hover.toggleClick}
        onPointerEnter={(e) => e.pointerType === "mouse" && hover.open()}
        onPointerLeave={(e) => e.pointerType === "mouse" && hover.close()}
        tabIndex={props.hidden() ? -1 : undefined}
        variant="text"
        size="md"
        class={cn(
          "w-full justify-start gap-3 rounded-md3-full py-2.5 whitespace-nowrap text-md3-on-surface-variant transition-colors",
          !props.isLeft() && "flex-row-reverse",
          "hover:text-md3-on-surface",
          "disabled:cursor-not-allowed disabled:opacity-38",
        )}
      >
        <SideNavSectionTriggerContent section={props.entry} isLeft={props.isLeft} />
      </Button>

      <SideNavSectionMenuContent
        section={props.entry}
        menuContentClass={menuContentClass}
        isLeft={props.isLeft}
        renderLink={props.renderLink}
        onContentMouseEnter={() => hover.cancelClose()}
        onContentMouseLeave={() => hover.close()}
      />
    </Menu.Root>
  );
}

function SideNavOverflowMenu(
  props: Readonly<{
    items: () => SideNavEntry[];
    isLeft: () => boolean;
    renderLink?: RenderLink;
  }>,
) {
  const hover = createHoverMenu();
  let buttonRef: HTMLButtonElement | undefined;

  return (
    <Menu.Root
      {...getMenuRootProps(props.isLeft(), { getAnchorElement: () => buttonRef ?? null })}
      open={hover.hoverOpen()}
      onOpenChange={hover.onOpenChange}
      onPointerDownOutside={hover.blockClick}
    >
      <Button
        ref={buttonRef}
        disabled={props.items().length === 0}
        onClick={hover.toggleClick}
        onPointerEnter={(e) => e.pointerType === "mouse" && hover.open()}
        onPointerLeave={(e) => e.pointerType === "mouse" && hover.close()}
        variant="text"
        size="md"
        class={cn(
          "w-full justify-start gap-3 rounded-md3-full py-2.5 whitespace-nowrap text-md3-on-surface-variant transition-colors",
          !props.isLeft() && "flex-row-reverse",
          "hover:text-md3-on-surface",
        )}
      >
        <span class="text-xl">
          <MoreHoriz />
        </span>
        <span class={cn("truncate", !props.isLeft() && "text-right")}>More</span>
      </Button>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            class={menuContentClass}
            onPointerEnter={(e) => e.pointerType === "mouse" && hover.cancelClose()}
            onPointerLeave={(e) => e.pointerType === "mouse" && hover.close()}
          >
            <For each={props.items()}>
              {(entry) => {
                if (isSection(entry)) {
                  return (
                    <Menu.Root {...getMenuRootProps(props.isLeft())}>
                      <Menu.TriggerItem
                        class={cn(
                          "state-layer flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-md3-on-surface-variant transition-colors",
                          "hover:bg-md3-surface-container-high hover:text-md3-on-surface",
                          entry.disabled && "pointer-events-none opacity-38",
                        )}
                      >
                        <SideNavSectionTriggerContent section={entry} isLeft={props.isLeft} />
                      </Menu.TriggerItem>

                      <SideNavSectionMenuContent
                        section={entry}
                        menuContentClass={menuContentClass}
                        isLeft={props.isLeft}
                        renderLink={props.renderLink}
                      />
                    </Menu.Root>
                  );
                }
                return (
                  <SideNavMenuItem
                    item={entry}
                    isLeft={props.isLeft}
                    renderLink={props.renderLink}
                  />
                );
              }}
            </For>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

const sideNavVariants = cva(
  "flex w-[68px] flex-col overflow-hidden bg-md3-surface sm:relative sm:transition-[width_transform] sm:will-change-[width] max-sm:fixed max-sm:top-0 max-sm:bottom-0 max-sm:z-50 max-sm:shadow-md3-elevation-3 max-sm:transition-[width_transform]",
  {
    compoundVariants: [
      {
        class: "sm:w-60 max-sm:w-60 max-sm:pointer-events-auto",
        open: true,
      },
      {
        class: "sm:w-17 max-sm:w-17 max-sm:pointer-events-none",
        open: false,
      },
      {
        class: "max-sm:translate-x-0",
        open: true,
        side: "left",
      },
      {
        class: "max-sm:-translate-x-full",
        open: false,
        side: "left",
      },
      {
        class: "max-sm:translate-x-0",
        open: true,
        side: "right",
      },
      {
        class: "max-sm:translate-x-full",
        open: false,
        side: "right",
      },
    ],
    defaultVariants: {
      open: true,
      side: "left" as const,
    },
    variants: {
      open: {
        false: "",
        true: "",
      },
      side: {
        left: "max-sm:left-0 max-sm:rounded-r-md3-lg",
        right: "max-sm:right-0 max-sm:rounded-l-md3-lg",
      },
    },
  },
);

const menuContentClass =
  "rounded-md3-md border-md3-outline-variant bg-md3-surface-container shadow-md3-elevation-3 min-w-36 flex flex-col border p-1 z-51";

interface SideNavProps {
  items: SideNavEntry[];
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right";
  renderLink?: RenderLink;
  class?: string;
}

function SideNav(props: Readonly<SideNavProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "items",
    "defaultOpen",
    "open",
    "onOpenChange",
    "side",
    "renderLink",
    "class",
  ]);

  const [internalOpen, setInternalOpen] = createSignal(local.defaultOpen ?? true);
  const shell = useSideNavShell();

  createEffect(() => {
    if (local.open !== undefined) {
      shell?.setOpen(local.open);
      setInternalOpen(local.open);
    }
  });

  createEffect(() => {
    if (shell) {
      local.onOpenChange?.(shell.open());
      setInternalOpen(shell.open());
    }
  });

  function setOpen(value: boolean): void {
    local.onOpenChange?.(value);
    shell?.setOpen(value);
    setInternalOpen(value);
  }

  const [isWidthTransitioning, setIsWidthTransitioning] = createSignal(false);
  const [overflowIndex, setOverflowIndex] = createSignal<number>();
  const isLeft = (): boolean => (local.side ?? "left") === "left";

  let listWrapperRef: HTMLDivElement | undefined;
  let listRef: HTMLUListElement | undefined;
  let overflowRef: HTMLDivElement | undefined;
  let observer: ResizeObserver | undefined = undefined;
  let rafId: number | undefined = undefined;
  let prevOverflowIndex: number | undefined = undefined;
  let cachedRowHeights: number[] = [];

  createEffect(() => {
    local.items;
    cachedRowHeights = [];
  });

  const cutoff = (): number => overflowIndex() ?? local.items.length;

  const measuredCount = createMemo(() => {
    const idx = overflowIndex();
    if (idx === undefined) {
      return local.items.length;
    }
    return Math.min(local.items.length, idx + 2);
  });

  const renderedItems = createMemo(() => local.items.slice(0, measuredCount()));

  const overflowItems = createMemo(() => local.items.slice(cutoff()));

  const computeInitialCutoff = (rows: HTMLElement[], gap: number, fullMaxH: number): number => {
    const heights = cachedRowHeights;
    let totalH = 0;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) {
        totalH += gap;
      }
      totalH += heights[i];
    }

    return totalH <= fullMaxH ? local.items.length : rows.length;
  };

  const measure = (): void => {
    if (isWidthTransitioning()) {
      return;
    }

    const wrapper = listWrapperRef;
    const ul = listRef;
    const overflowEl = overflowRef;

    if (!wrapper || !ul || !overflowEl) {
      return;
    }

    if (local.items.length === 0) {
      prevOverflowIndex = undefined;
      setOverflowIndex(undefined);
      return;
    }

    const rows = [...ul.children].filter((el): el is HTMLElement => el instanceof HTMLElement);

    if (cachedRowHeights.length !== rows.length) {
      cachedRowHeights = rows.map((row) => row.offsetHeight);
    }

    const heights = cachedRowHeights;
    const gap = Number.parseFloat(getComputedStyle(ul).rowGap) || 0;
    const fullMaxH = wrapper.clientHeight;
    if (fullMaxH <= 0) {
      return;
    }

    const reservedH = overflowEl.clientHeight;
    const maxVisibleH = fullMaxH - reservedH;
    if (maxVisibleH <= 0) {
      return;
    }

    let nextCutoff =
      overflowIndex() === undefined ? computeInitialCutoff(rows, gap, fullMaxH) : cutoff();

    let visibleH = 0;
    const limit = Math.min(nextCutoff, rows.length);
    for (let i = 0; i < limit; i++) {
      if (i > 0) {
        visibleH += gap;
      }
      visibleH += heights[i];
    }

    while (nextCutoff > 0 && visibleH > maxVisibleH) {
      visibleH -= heights[nextCutoff - 1];
      if (nextCutoff - 1 > 0) {
        visibleH -= gap;
      }
      nextCutoff--;
    }

    while (nextCutoff < rows.length) {
      const addH = heights[nextCutoff] + (nextCutoff > 0 ? gap : 0);
      if (visibleH + addH > maxVisibleH) {
        break;
      }
      visibleH += addH;
      nextCutoff++;
    }

    const finalIndex = nextCutoff >= local.items.length ? undefined : nextCutoff;

    if (finalIndex !== prevOverflowIndex) {
      prevOverflowIndex = finalIndex;
      setOverflowIndex(finalIndex);
    }
  };

  onMount(() => {
    measure();

    observer = new ResizeObserver(() => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(measure);
    });

    if (listWrapperRef) {
      observer.observe(listWrapperRef);
    }
    if (listRef) {
      observer.observe(listRef);
    }
    if (overflowRef) {
      observer.observe(overflowRef);
    }

    onCleanup(() => {
      observer?.disconnect();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    });
  });

  return (
    <nav
      {...rest}
      class={cn(
        sideNavVariants({ open: internalOpen(), side: isLeft() ? "left" : "right" }),
        local.class,
      )}
      onTransitionStart={(e: TransitionEvent) => {
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== "width") return;
        setIsWidthTransitioning(true);
      }}
      onTransitionEnd={(e: TransitionEvent) => {
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== "width") return;
        setIsWidthTransitioning(false);
        measure();
      }}
    >
      <div class="px-3 pt-2 pb-1">
        <button
          type="button"
          onClick={() => setOpen(!internalOpen())}
          class={cn(
            "state-layer flex w-full items-center gap-3 rounded-md3-full px-3 py-2.5 whitespace-nowrap text-md3-on-surface-variant transition-colors hover:text-md3-on-surface",
            !isLeft() && "flex-row-reverse",
          )}
          aria-label={internalOpen() ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span class="text-xl">
            <Show when={isLeft() === internalOpen()} fallback={<ChevronRight />}>
              <ChevronLeft />
            </Show>
          </span>
          <span class="truncate text-sm font-medium">Collapse</span>
        </button>
      </div>

      <div ref={listWrapperRef} class="relative min-h-0 flex-1 overflow-hidden px-3 py-2">
        <ul ref={listRef} class="relative flex flex-col gap-1">
          <For each={renderedItems()}>
            {(entry, index) => {
              const hidden = (): boolean => overflowIndex() !== undefined && index() >= cutoff();

              return isSection(entry) ? (
                <li
                  aria-hidden={hidden() ? true : undefined}
                  class={cn(hidden() && "pointer-events-none invisible absolute inset-x-0 top-0")}
                >
                  <SideNavSectionMenu
                    entry={entry}
                    hidden={hidden}
                    isLeft={isLeft}
                    renderLink={local.renderLink}
                  />
                </li>
              ) : (
                <li
                  aria-hidden={hidden() ? true : undefined}
                  class={cn(hidden() && "pointer-events-none invisible absolute inset-x-0 top-0")}
                >
                  <SideNavLink
                    item={entry}
                    class={cn(
                      "state-layer flex w-full items-center gap-3 rounded-md3-full px-3 py-2.5 text-sm font-medium whitespace-nowrap text-md3-on-surface-variant no-underline transition-colors",
                      !isLeft() && "flex-row-reverse",
                      "hover:text-md3-on-surface",
                      entry.active &&
                        "bg-md3-secondary-container text-md3-on-secondary-container hover:text-md3-on-secondary-container",
                      (entry.disabled === true || hidden()) && "pointer-events-none opacity-38",
                    )}
                    isLeft={isLeft()}
                    renderLink={local.renderLink}
                    tabIndex={hidden() ? -1 : undefined}
                  />
                </li>
              );
            }}
          </For>
        </ul>

        <div
          ref={overflowRef}
          class={cn(
            "absolute bottom-0 left-0 w-full bg-md3-surface px-3 py-2",
            overflowItems().length === 0 && "pointer-events-none invisible",
          )}
        >
          <SideNavOverflowMenu
            items={overflowItems}
            isLeft={isLeft}
            renderLink={local.renderLink}
          />
        </div>
      </div>
    </nav>
  );
}

function getMenuRootProps(
  isLeft: boolean,
  positioning: MenuRootBaseProps["positioning"] = {},
): MenuRootBaseProps {
  return {
    closeOnSelect: true,
    lazyMount: true,
    positioning: {
      flip: true,
      gutter: 4,
      placement: isLeft ? "right-start" : ("left-start" as const),
      ...positioning,
    },
    unmountOnExit: true,
  } as const;
}

export { SideNav, type SideNavProps };
export type { SideNavEntry, SideNavItemData, SideNavSectionData };
