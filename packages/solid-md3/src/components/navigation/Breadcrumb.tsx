import ChevronRight from "@iconify-solid/material-symbols/chevron-right";
import { type JSX, For, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  separator?: string;
  class?: string;
}

export function Breadcrumb(props: Readonly<BreadcrumbProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["items", "separator", "class"]);

  return (
    <nav
      class={cn("flex items-center gap-1 text-sm", local.class)}
      {...rest}
      aria-label="Breadcrumb"
    >
      <For each={local.items}>
        {(item, index) => (
          <>
            <Show when={index() > 0}>
              <Show
                when={local.separator}
                fallback={<ChevronRight class="text-base text-md3-on-surface-variant" />}
              >
                <span class="text-base leading-none text-md3-on-surface-variant">
                  {local.separator}
                </span>
              </Show>
            </Show>
            <Show
              when={item.href && index() < local.items.length - 1}
              fallback={
                <span
                  class={cn(
                    "text-md3-on-surface-variant",
                    index() === local.items.length - 1 && "font-medium text-md3-on-surface",
                  )}
                >
                  {item.label}
                </span>
              }
            >
              <a
                href={item.href}
                class="state-layer rounded-md3-xs px-2 py-1 text-md3-primary transition-colors hover:opacity-80"
              >
                {item.label}
              </a>
            </Show>
          </>
        )}
      </For>
    </nav>
  );
}

export type { BreadcrumbProps };
