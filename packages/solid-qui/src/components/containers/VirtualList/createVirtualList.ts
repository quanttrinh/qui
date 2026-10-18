import { type VirtualItem, createVirtualizer } from "@tanstack/solid-virtual";
import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

/**
 * Controls the shared virtualized list rendering used by `Select` and `Combobox`.
 */
export interface VirtualListController {
  /** Attach to the scrollable content element. */
  setScrollElement: (element: HTMLElement | null) => void;
  /** Scroll a given item index into view (used by the machine's `scrollToIndexFn`). */
  scrollToIndex: (index: number, immediate?: boolean) => void;
  /** Total height of all (virtual) items, in pixels. */
  getTotalSize: () => number;
  /** The virtual items currently in the viewport window. */
  getVirtualItems: () => VirtualItem[];
  /** Report an item element's measured size to the virtualizer. */
  measureElement: (element: HTMLDivElement | null) => void;
}

/** Create a virtualizer whose `count` follows the given accessor. */
export function createVirtualList(
  count: Accessor<number>,
  options: { estimateSize?: number; overscan?: number } = {},
): VirtualListController {
  const estimateSize = options.estimateSize ?? 40;
  const overscan = options.overscan ?? 5;
  const [element, setElement] = createSignal<HTMLElement | null>(null);
  const [scrollElement, setScrollElement] = createSignal<HTMLElement | null>(null);

  const virtualizer = createVirtualizer({
    get count() {
      return count();
    },
    estimateSize: () => estimateSize,
    getScrollElement: () => scrollElement(),
    overscan,
    useAnimationFrameWithResizeObserver: true,
    useCachedMeasurements: true,
  });

  /**
   * Solid invokes element refs before the node is connected, where the element
   * still belongs to an inert document (`ownerDocument.defaultView` is null) and
   * the virtualizer cannot resolve its window. Attach once it is connected.
   */
  createEffect(() => {
    const node = element();

    if (!node) {
      setScrollElement(null);
      return;
    }

    if (node.isConnected) {
      setScrollElement(node);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setScrollElement(element()?.isConnected ? element() : null);
    });
    onCleanup(() => {
      cancelAnimationFrame(frame);
    });
  });

  return {
    setScrollElement: setElement,
    scrollToIndex(index, immediate) {
      virtualizer.scrollToIndex(index, {
        align: "auto",
        behavior: immediate ? "instant" : "smooth",
      });
    },
    getTotalSize: () => virtualizer.getTotalSize(),
    getVirtualItems: () => virtualizer.getVirtualItems(),
    measureElement(node) {
      virtualizer.measureElement(node);
    },
  };
}
