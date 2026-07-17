import { Combobox as ArkCombobox, createListCollection } from "@ark-ui/solid/combobox";
import Check from "@iconify-solid/material-symbols/check";
import Close from "@iconify-solid/material-symbols/close";
import UnfoldMore from "@iconify-solid/material-symbols/unfold-more";
import { createDebouncer } from "@tanstack/solid-pacer";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { type VariantProps, cva } from "class-variance-authority";
import Fuse from "fuse.js";
import { Index, type JSX, Show, createEffect, createMemo, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "../../cn";
import { ScrollArea } from "../containers/ScrollArea";
import { Text } from "../typography/Text";

const comboboxVariants = cva(
  "pr-20 w-full rounded-md3-sm border border-md3-outline-variant bg-md3-surface-container-lowest text-md3-on-surface transition-colors outline-none placeholder:text-md3-on-surface-variant hover:border-md3-outline focus:border-md3-primary focus:ring-1 focus:ring-md3-primary",
  {
    defaultVariants: {
      size: "md",
    },
    variants: {
      size: {
        lg: "h-12 px-4 py-2 text-base",
        md: "h-10 px-3 py-1.5 text-sm",
        sm: "h-8 px-2.5 py-1 text-sm",
      },
    },
  },
);

export type ComboboxProps = {
  placeholder?: string;
  filter?: (query: string) => boolean;
  nonce?: string;
} & VariantProps<typeof comboboxVariants> &
  Omit<ArkCombobox.RootProps<string>, "scrollToIndexFn" | "asChild" | "positioning">;

export function Combobox(props: Readonly<ComboboxProps>): JSX.Element {
  const [query, setQuery] = createSignal("");
  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement | null>(null);

  const debouncedSetQuery = createDebouncer(setQuery, { wait: 300 });

  const fuse = createMemo(
    () =>
      new Fuse(props.collection.items, {
        ignoreDiacritics: true,
        isCaseSensitive: false,
        threshold: 0.4,
        useTokenSearch: true,
      }),
  );

  const filteredCollection = createMemo(() => {
    const trimmedValue = query().trim();
    if (!trimmedValue) {
      return props.collection;
    }
    return createListCollection<string>({
      items: fuse()
        .search(trimmedValue)
        .map((result) => result.item),
    });
  });

  const virtualizer = createVirtualizer({
    get count() {
      return filteredCollection().items.length;
    },
    estimateSize: () => 40,
    getScrollElement: () => scrollRef(),
    overscan: 1,
    useAnimationFrameWithResizeObserver: true,
    useCachedMeasurements: true,
  });

  return (
    <ArkCombobox.Root
      collection={filteredCollection()}
      onInputValueChange={(details) => {
        debouncedSetQuery.maybeExecute(details.inputValue);
      }}
      openOnChange
      closeOnSelect
      positioning={{ flip: true, sameWidth: true }}
      lazyMount
      unmountOnExit
      scrollToIndexFn={(details) => {
        virtualizer.scrollToIndex(details.index, {
          align: "auto",
          behavior: details.immediate ? "instant" : "smooth",
        });
      }}
    >
      <ArkCombobox.Control class="relative">
        <ArkCombobox.Input
          placeholder={props.placeholder}
          class={cn(comboboxVariants({ size: props.size }))}
        />
        <div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          <Show when={props.value}>
            <ArkCombobox.ClearTrigger class="state-layer relative flex h-7 w-7 items-center justify-center overflow-visible! rounded-md3-full text-md3-on-surface-variant before:absolute before:-inset-2 before:content-['']">
              <Close />
            </ArkCombobox.ClearTrigger>
          </Show>
          <ArkCombobox.Trigger class="state-layer relative flex h-7 w-7 items-center justify-center overflow-visible! rounded-md3-full text-md3-on-surface-variant before:absolute before:-inset-2 before:content-['']">
            <UnfoldMore />
          </ArkCombobox.Trigger>
        </div>
      </ArkCombobox.Control>
      <Portal>
        <ArkCombobox.Positioner class="z-50">
          <ArkCombobox.Content
            ref={(el) => {
              createEffect(() => {
                el.style.setProperty("--total-size", `${virtualizer.getTotalSize()}px`);
              });
            }}
            class="box-content flex h-(--total-size) max-h-[min(480px,var(--available-height))] min-h-(--reference-height) w-(--reference-width) flex-col rounded-md3-md border border-md3-outline-variant bg-md3-surface-container py-2 shadow-md3-elevation-3"
          >
            <Show
              when={filteredCollection().items.length > 0}
              fallback={
                <div class="flex h-12 w-full items-center justify-center px-3 text-md3-label-md text-md3-on-surface-variant">
                  <Text>No results found</Text>
                </div>
              }
            >
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
                        const { items } = filteredCollection();
                        const { index } = virtualItem();
                        return index >= 0 && index < items.length ? items[index] : undefined;
                      });

                      return (
                        <Show when={memoizedItem()} keyed>
                          {(item) => (
                            <ArkCombobox.Item
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
                              <ArkCombobox.ItemText
                                asChild={(childProps) => {
                                  const textProps = childProps();
                                  return <Text {...textProps}>{textProps.children}</Text>;
                                }}
                              >
                                {item}
                              </ArkCombobox.ItemText>
                              <ArkCombobox.ItemIndicator>
                                <Check />
                              </ArkCombobox.ItemIndicator>
                            </ArkCombobox.Item>
                          )}
                        </Show>
                      );
                    }}
                  </Index>
                </div>
              </ScrollArea>
            </Show>
          </ArkCombobox.Content>
        </ArkCombobox.Positioner>
      </Portal>
    </ArkCombobox.Root>
  );
}
