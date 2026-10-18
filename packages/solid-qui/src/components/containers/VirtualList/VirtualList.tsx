import { type JSX, Index, Show, createMemo } from "solid-js";

import type { VirtualListController } from "./createVirtualList";

import { virtualList } from "../../../../styled-system/recipes";

export interface VirtualListProps<T> {
  controller: VirtualListController;
  /** Resolve the item at a given index. */
  getItem: (index: number) => T | undefined;
  /** Machine props for the item element. */
  getItemProps: (item: T) => JSX.HTMLAttributes<HTMLDivElement>;
  /** Render the content of each item (like `RadioGroup`'s render prop). */
  render: (item: T) => JSX.Element;
}

const listStyles = virtualList();

/**
 * Renders a spacer plus the currently virtualized items. The machine props are
 * applied to each item so keyboard navigation, highlighting and selection keep working.
 *
 * The `render` prop controls each item's content, like `RadioGroup`'s render prop.
 */
export function VirtualList<T>(props: VirtualListProps<T>): JSX.Element {
  return (
    <div
      class={listStyles.spacer}
      style={{ "--total-size": `${props.controller.getTotalSize()}px` }}
    >
      <Index each={props.controller.getVirtualItems()}>
        {(virtualItem) => {
          const item = createMemo(() => props.getItem(virtualItem().index));

          return (
            <Show when={item()}>
              {(resolved) => (
                <div
                  {...props.getItemProps(resolved())}
                  data-index={virtualItem().index}
                  ref={props.controller.measureElement}
                  class={listStyles.item}
                  style={{
                    "--item-offset": `${virtualItem().start}px`,
                    "--item-size": `${virtualItem().size}px`,
                  }}
                >
                  {props.render(resolved())}
                </div>
              )}
            </Show>
          );
        }}
      </Index>
    </div>
  );
}
