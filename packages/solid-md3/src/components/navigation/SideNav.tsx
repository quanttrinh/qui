import { Menu } from "@ark-ui/solid/menu";
import ChevronLeft from "@iconify-solid/material-symbols/chevron-left";
import ChevronRight from "@iconify-solid/material-symbols/chevron-right";
import MoreHoriz from "@iconify-solid/material-symbols/more-horiz";
import {
  For,
  type JSX,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import { Dynamic, Portal } from "solid-js/web";

import { cn } from "../../cn";

interface SideNavItemData {
  type: "item";
  href: string;
  icon?: JSX.Element;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

interface SideNavSectionData {
  type: "section";
  icon?: JSX.Element;
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
      {local.item.icon}
      <span class={cn("truncate", !local.isLeft && "text-right")}>{local.item.label}</span>
    </Dynamic>
  );
}

function SideNavSectionContent(
  props: Readonly<{ section: SideNavSectionData; isLeft: boolean }>,
): JSX.Element {
  return (
    <>
      {props.section.icon}
      <span class={cn("flex-1 truncate", !props.isLeft && "text-right")}>
        {props.section.label}
      </span>
      <span class="text-xl">
        <Show when={props.isLeft} fallback={<ChevronLeft />}>
          <ChevronRight />
        </Show>
      </span>
    </>
  );
}

function SideNavMenuItem(
  props: Readonly<{
    item: SideNavItemData;
    isLeft: boolean;
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
            isLeft={props.isLeft}
            renderLink={props.renderLink}
          />
        );
      }}
    />
  );
}

function SideNavSectionMenu(
  props: Readonly<{
    section: SideNavSectionData;
    menuContentClass: string;
    isLeft: boolean;
    renderLink?: RenderLink;
  }>,
): JSX.Element {
  return (
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={props.menuContentClass}>
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

function computeInitialVisibleH(rows: HTMLElement[], gap: number, count: number): number {
  let visibleH = 0;
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      visibleH += gap;
    }
    visibleH += rows[i].offsetHeight;
  }
  return visibleH;
}

interface SideNavProps {
  items: SideNavEntry[];
  defaultOpen?: boolean;
  side?: "left" | "right";
  renderLink?: RenderLink;
  class?: string;
}

function SideNav(props: Readonly<SideNavProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["items", "defaultOpen", "side", "renderLink", "class"]);

  const [open, setOpen] = createSignal(local.defaultOpen ?? true);
  const [isWidthTransitioning, setIsWidthTransitioning] = createSignal(false);
  const [overflowIndex, setOverflowIndex] = createSignal<number>();
  const isLeft = (): boolean => (local.side ?? "left") === "left";

  /* eslint-disable no-unassigned-vars, init-declarations */
  let listWrapperRef: HTMLDivElement | undefined;
  let listRef: HTMLUListElement | undefined;
  let overflowRef: HTMLDivElement | undefined;
  /* eslint-enable no-unassigned-vars, init-declarations */
  let observer: ResizeObserver | undefined = undefined;
  let rafId: number | undefined = undefined;
  let prevOverflowIndex: number | undefined = undefined;

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
    let totalH = 0;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) {
        totalH += gap;
      }
      totalH += rows[i].offsetHeight;
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

    let visibleH = computeInitialVisibleH(rows, gap, Math.min(nextCutoff, rows.length));

    while (nextCutoff > 0 && visibleH > maxVisibleH) {
      visibleH -= rows[nextCutoff - 1].offsetHeight;
      if (nextCutoff - 1 > 0) {
        visibleH -= gap;
      }
      nextCutoff--;
    }

    while (nextCutoff < rows.length) {
      const addH = rows[nextCutoff].offsetHeight + (nextCutoff > 0 ? gap : 0);
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

  const menuRootProps = () =>
    ({
      closeOnSelect: true,
      lazyMount: true,
      positioning: {
        flip: true,
        gutter: 4,
        placement: isLeft() ? "right-start" : ("left-start" as const),
      },
      unmountOnExit: true,
    }) as const;

  const menuContentClass =
    "rounded-md3-md border-md3-outline-variant bg-md3-surface-container shadow-md3-elevation-3 min-w-36 flex flex-col border p-1";

  return (
    <nav
      {...rest}
      class={cn(
        "relative flex flex-col overflow-hidden transition-[width] duration-300",
        open() ? "w-60" : "w-17",
        isLeft() ? "border-r" : "border-l",
        "border-md3-outline-variant",
        local.class,
      )}
      onTransitionStart={(e: TransitionEvent) => {
        if (e.target !== e.currentTarget) {
          return;
        }
        if (e.propertyName !== "width") {
          return;
        }
        setIsWidthTransitioning(true);
      }}
      onTransitionEnd={(e: TransitionEvent) => {
        if (e.target !== e.currentTarget) {
          return;
        }
        if (e.propertyName !== "width") {
          return;
        }
        setIsWidthTransitioning(false);
        measure();
      }}
    >
      <div class="px-3 pt-2 pb-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          class={cn(
            "state-layer flex w-full items-center gap-3 rounded-md3-full px-3 py-2.5 whitespace-nowrap text-md3-on-surface-variant transition-colors hover:text-md3-on-surface",
            !isLeft() && "flex-row-reverse",
          )}
          aria-label={open() ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span class="text-xl">
            <Show when={isLeft() === open()} fallback={<ChevronRight />}>
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
                <Menu.Root {...menuRootProps()}>
                  <li
                    aria-hidden={hidden() ? true : undefined}
                    class={cn(hidden() && "pointer-events-none invisible absolute inset-x-0 top-0")}
                  >
                    <Menu.Trigger
                      disabled={entry.disabled === true || hidden()}
                      class={cn(
                        "state-layer flex w-full items-center gap-3 rounded-md3-full px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap text-md3-on-surface-variant transition-colors",
                        !isLeft() && "flex-row-reverse",
                        "hover:text-md3-on-surface",
                        "disabled:cursor-not-allowed disabled:opacity-38",
                      )}
                      tabIndex={hidden() ? -1 : undefined}
                    >
                      <SideNavSectionContent section={entry} isLeft={isLeft()} />
                    </Menu.Trigger>
                  </li>

                  <SideNavSectionMenu
                    section={entry}
                    menuContentClass={menuContentClass}
                    isLeft={isLeft()}
                    renderLink={local.renderLink}
                  />
                </Menu.Root>
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
          <Menu.Root {...menuRootProps()}>
            <Menu.Trigger
              disabled={overflowItems().length === 0}
              class={cn(
                "state-layer flex w-full items-center gap-3 rounded-md3-full px-3 py-2.5 text-sm font-medium whitespace-nowrap text-md3-on-surface-variant transition-colors",
                !isLeft() && "flex-row-reverse",
                "hover:text-md3-on-surface",
              )}
            >
              <span class="text-xl">
                <MoreHoriz />
              </span>
              <span class={cn("truncate", !isLeft() && "text-right")}>More</span>
            </Menu.Trigger>

            <Portal>
              <Menu.Positioner>
                <Menu.Content class={menuContentClass}>
                  <For each={overflowItems()}>
                    {(entry) => {
                      if (isSection(entry)) {
                        return (
                          <Menu.Root {...menuRootProps()}>
                            <Menu.TriggerItem
                              class={cn(
                                "state-layer flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-md3-on-surface-variant transition-colors",
                                "hover:bg-md3-surface-container-high hover:text-md3-on-surface",
                                entry.disabled && "pointer-events-none opacity-38",
                              )}
                            >
                              <SideNavSectionContent section={entry} isLeft={isLeft()} />
                            </Menu.TriggerItem>

                            <SideNavSectionMenu
                              section={entry}
                              menuContentClass={menuContentClass}
                              isLeft={isLeft()}
                              renderLink={local.renderLink}
                            />
                          </Menu.Root>
                        );
                      }
                      return (
                        <SideNavMenuItem
                          item={entry}
                          isLeft={isLeft()}
                          renderLink={local.renderLink}
                        />
                      );
                    }}
                  </For>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </div>
      </div>
    </nav>
  );
}

export { SideNav, type SideNavProps };
export type { SideNavEntry, SideNavItemData, SideNavSectionData };
