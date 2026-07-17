import { Select as ArkSelect } from "@ark-ui/solid/select";
import Check from "@iconify-solid/material-symbols/check";
import UnfoldMore from "@iconify-solid/material-symbols/unfold-more";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { type VariantProps, cva } from "class-variance-authority";
import { Index, type JSX, Show, createEffect, createMemo, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "../../cn";
import { ScrollArea } from "../containers/ScrollArea";
import { Text } from "../typography/Text";

const selectVariants = cva(
  "group flex w-full items-center justify-between rounded-md3-sm border border-md3-outline-variant bg-md3-surface-container-lowest py-1.5 pr-2 pl-3 text-md3-body-md text-md3-on-surface transition-colors outline-none hover:border-md3-outline focus:border-md3-primary focus:ring-1 focus:ring-md3-primary data-[state=open]:border-md3-primary",
  {
    defaultVariants: {
      size: "md",
    },
    variants: {
      size: {
        lg: "h-12",
        md: "h-10",
        sm: "h-8",
      },
    },
  },
);

export type SelectProps = {
  placeholder?: string;
  nonce?: string;
} & VariantProps<typeof selectVariants> &
  Omit<ArkSelect.RootProps<string>, "scrollToIndexFn" | "asChild" | "positioning">;

export function Select(props: Readonly<SelectProps>): JSX.Element {
  const [scrollElement, setScrollRef] = createSignal<HTMLDivElement | null>(null);

  const virtualizer = createVirtualizer({
    get count() {
      return props.collection?.items.length || 0;
    },
    estimateSize: () => 40,
    getScrollElement: () => scrollElement(),
    overscan: 1,
    useAnimationFrameWithResizeObserver: true,
    useCachedMeasurements: true,
  });

  return (
    <ArkSelect.Root
      positioning={{ flip: true, sameWidth: true }}
      lazyMount
      unmountOnExit
      scrollToIndexFn={(details) => {
        virtualizer.scrollToIndex(details.index, {
          align: "auto",
          behavior: details.immediate ? "instant" : "smooth",
        });
      }}
      {...props}
    >
      <ArkSelect.Control class="relative">
        <ArkSelect.Trigger class={cn(selectVariants({ size: props.size }))}>
          <ArkSelect.ValueText
            class="text-left"
            placeholder={props.placeholder}
            asChild={(childProps) => {
              const textProps = childProps();
              return <Text {...textProps}>{textProps.children}</Text>;
            }}
          />

          <div class="state-layer flex h-7 w-7 items-center justify-center overflow-hidden rounded-md3-full text-md3-on-surface-variant">
            <ArkSelect.Indicator>
              <UnfoldMore />
            </ArkSelect.Indicator>
          </div>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal>
        <ArkSelect.Positioner
          ref={(el) => {
            createEffect(() => {
              el.style.setProperty("--total-size", `${virtualizer.getTotalSize()}px`);
            });
          }}
          class="z-50"
        >
          <ArkSelect.Content class="box-content flex h-(--total-size) max-h-[min(480px,var(--available-height))] min-h-(--reference-height) w-(--reference-width) flex-col rounded-md3-md border border-md3-outline-variant bg-md3-surface-container py-2 shadow-md3-elevation-3">
            <ScrollArea
              class="h-full w-full"
              scrollbarClass="my-0"
              viewportRef={setScrollRef}
              nonce={props.nonce}
            >
              <div
                ref={(el) => {
                  createEffect(() => {
                    el.style.setProperty("--total-size", `${virtualizer.getTotalSize()}px`);
                  });
                }}
                class="relative h-(--total-size) w-full"
              >
                <Index each={virtualizer.getVirtualItems()}>
                  {(virtualItem) => {
                    const memoizedItem = createMemo(() => {
                      const items = props.collection?.items;
                      const { index } = virtualItem();
                      return index >= 0 && index < items.length ? items[index] : undefined;
                    });

                    return (
                      <Show when={memoizedItem()} keyed>
                        {(item) => (
                          <ArkSelect.Item
                            data-index={virtualItem().index}
                            ref={(el) => {
                              createEffect(() => {
                                virtualItem();
                                virtualizer.measureElement(el);
                                el.style.setProperty("--item-offset", `${virtualItem().start}px`);
                              });
                            }}
                            item={item}
                            class={cn(
                              "absolute top-0 left-0 w-full translate-y-(--item-offset)",
                              "flex items-center justify-between",
                              "overflow-hidden px-3 py-2",
                              "text-md3-body-md font-medium text-md3-on-surface",
                              "state-layer cursor-pointer",
                              "data-highlighted:bg-md3-surface-container-highest",
                              "data-[state=checked]:bg-md3-primary-container",
                              "data-[state=checked]:text-md3-on-primary-container",
                            )}
                          >
                            <ArkSelect.ItemText
                              asChild={(childProps) => {
                                const textProps = childProps();
                                return <Text {...textProps}>{textProps.children}</Text>;
                              }}
                            >
                              {item}
                            </ArkSelect.ItemText>
                            <ArkSelect.ItemIndicator>
                              <Check />
                            </ArkSelect.ItemIndicator>
                          </ArkSelect.Item>
                        )}
                      </Show>
                    );
                  }}
                </Index>
              </div>
            </ScrollArea>
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
      <ArkSelect.HiddenSelect />
    </ArkSelect.Root>
  );
}
