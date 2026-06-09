import type { JSX } from "solid-js";

import { ScrollArea as ArkScrollArea } from "@ark-ui/solid/scroll-area";

import { cn } from "../../cn";

export interface ScrollAreaProps {
  children: JSX.Element;
  class?: string;
  scrollbarClass?: string;
  viewportRef?: (el: HTMLDivElement | null) => void;
  nonce?: string;
}

export function ScrollArea(props: Readonly<ScrollAreaProps>): JSX.Element {
  return (
    <ArkScrollArea.Root class={cn("size-full min-h-0 min-w-0", props.class)} nonce={props.nonce}>
      <ArkScrollArea.Viewport
        ref={props.viewportRef}
        class="scrollbar-hide size-full outline-none"
        nonce={props.nonce}
      >
        <ArkScrollArea.Content class="size-full" nonce={props.nonce}>
          {props.children}
        </ArkScrollArea.Content>
      </ArkScrollArea.Viewport>
      <ArkScrollArea.Scrollbar
        orientation="vertical"
        class={cn(
          "absolute top-0 right-0 h-full rounded-full bg-md3-surface-container-high",
          "opacity-0 transition-opacity delay-500 duration-500 hover:opacity-100 hover:delay-[0ms] data-scrolling:opacity-100 data-scrolling:delay-[0ms]",
          "w-1.5 transition-[width] hover:w-3 active:w-3",
          "before:absolute before:top-0 before:-left-3 before:h-full before:w-12 before:content-['']",
        )}
        nonce={props.nonce}
      >
        <ArkScrollArea.Thumb
          class="min-h-5 w-full rounded-full bg-md3-outline"
          nonce={props.nonce}
        />
      </ArkScrollArea.Scrollbar>
    </ArkScrollArea.Root>
  );
}
