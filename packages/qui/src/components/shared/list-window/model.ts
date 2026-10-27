/** How a list is presented: a scrolling window or an overflow split. */
export type ListMode = "virtualize" | "overflow";

/** One rendered item with its absolute position in the source list. */
export interface ListEntry<TItem> {
  index: number;
  item: TItem;
}

/** The shared render model produced for both list modes. */
export interface ListWindow<TItem> {
  /** Total number of source items. */
  total: number;
  /** Items inside the window. */
  entries: readonly ListEntry<TItem>[];
  /** Items that move to an overflow submenu. Empty in virtualize mode. */
  overflow: readonly TItem[];
  /** Pixels to translate the rendered entries block. */
  offset: number;
  /** Height of the scrolling canvas (virtualize) or rendered block (overflow). */
  totalSize: number;
}

interface ListWindowBase<TItem> {
  items: readonly TItem[];
  /** Measured size of the scroll viewport or available menu space. */
  viewportSize: number;
  /** Size used before the viewport has been measured. */
  fallbackViewportSize?: number;
}

type ListWindowOptions<TItem> =
  | (ListWindowBase<TItem> & {
      mode: "virtualize";
      /** Current scroll offset. */
      scrollOffset?: number;
      /** Extra items rendered on each side. */
      overscan?: number;
    })
  | (ListWindowBase<TItem> & {
      mode: "overflow";
      /** Space reserved for the trailing overflow entry, in pixels. */
      reserveSize?: number;
    });

interface ListRevealOptions {
  /** Index of the item to reveal. */
  index: number;
  /** Current scroll offset. */
  scrollOffset: number;
  /** Measured viewport size. */
  viewportSize: number;
  /** Space kept between the revealed item and the viewport edge. */
  padding?: number;
}

interface ListMetricsOptions {
  /** Size assumed for items that have not been measured yet. */
  estimate: number;
}

interface WindowRange {
  start: number;
  end: number;
}

interface RangeOptions {
  scrollOffset: number;
  viewportSize: number;
  fallbackViewportSize: number;
  overscan: number;
  includePartial: boolean;
}

interface BuildOptions<TItem> {
  items: readonly TItem[];
  start: number;
  end: number;
  offset: number;
  totalSize: number;
  overflow: boolean;
}

function buildWindow<TItem>({
  items,
  start,
  end,
  offset,
  totalSize,
  overflow,
}: BuildOptions<TItem>): ListWindow<TItem> {
  const entries: ListEntry<TItem>[] = [];
  for (let index = start; index < end; index += 1) {
    entries.push({ index, item: items[index] });
  }
  return {
    total: items.length,
    entries,
    overflow: overflow ? items.slice(end) : [],
    offset,
    totalSize,
  };
}

function emptyWindow<TItem>(): ListWindow<TItem> {
  return { total: 0, entries: [], overflow: [], offset: 0, totalSize: 0 };
}

/**
 * The sizing engine shared by virtualized lists and overflow menus. It keeps
 * measured row sizes in a cached prefix sum and turns them into a `ListWindow`.
 */
export class ListMetrics {
  private count = 0;
  private estimate: number;
  private readonly measured = new Map<number, number>();
  private readonly offsets: number[] = [0];

  constructor({ estimate }: ListMetricsOptions) {
    this.estimate = Number.isFinite(estimate) ? Math.max(1, estimate) : 1;
    this.rebuild();
  }

  /** Updates the fallback size for unmeasured rows. */
  public setEstimate(estimate: number): boolean {
    const next = Number.isFinite(estimate) ? Math.max(1, estimate) : 1;
    if (next === this.estimate) {
      return false;
    }
    this.estimate = next;
    this.rebuild();
    return true;
  }

  /**
   * Records a measured item size, e.g. from `ListSizeObserver`. Returns whether
   * any offset changed, so callers can avoid unnecessary renders.
   */
  public setSize(index: number, size: number): boolean {
    if (index < 0 || index >= this.count || !Number.isFinite(size)) {
      return false;
    }
    const next = Math.max(0, size);
    const previous = this.sizeOf(index);
    if (next === previous && this.measured.has(index)) {
      return false;
    }
    this.measured.set(index, next);
    const delta = next - previous;
    if (delta === 0) {
      return false;
    }
    for (let cursor = index + 1; cursor <= this.count; cursor += 1) {
      this.offsets[cursor] = (this.offsets[cursor] ?? 0) + delta;
    }
    return true;
  }

  /** The scroll offset needed to reveal `index`, if it is not fully visible. */
  public reveal({
    index,
    scrollOffset,
    viewportSize,
    padding = 0,
  }: ListRevealOptions): number | undefined {
    if (this.count === 0) {
      return undefined;
    }
    const clamped = Math.min(Math.max(index, 0), this.count - 1);
    const top = this.offsetOf(clamped);
    const bottom = this.offsetOf(clamped + 1);
    const visibleTop = scrollOffset + padding;
    const visibleBottom = scrollOffset + viewportSize - padding;
    if (top < visibleTop) {
      return Math.max(0, top - padding);
    }
    if (bottom > visibleBottom) {
      return Math.max(0, bottom + padding - viewportSize);
    }
    return undefined;
  }

  /**
   * Computes the shared render model. Updates the item count from
   * `options.items`, so callers do not need to synchronise it separately.
   */
  public window<TItem>(options: ListWindowOptions<TItem>): ListWindow<TItem> {
    this.setTotal(options.items.length);
    return options.mode === "overflow" ? this.overflowWindow(options) : this.virtualWindow(options);
  }

  private virtualWindow<TItem>({
    items,
    viewportSize,
    fallbackViewportSize = 0,
    scrollOffset = 0,
    overscan = 0,
  }: Extract<ListWindowOptions<TItem>, { mode: "virtualize" }>): ListWindow<TItem> {
    if (items.length === 0) {
      return emptyWindow<TItem>();
    }
    const range = this.range({
      scrollOffset,
      viewportSize,
      fallbackViewportSize,
      overscan,
      includePartial: true,
    });
    return buildWindow({
      items,
      start: range.start,
      end: range.end,
      offset: this.offsetOf(range.start),
      totalSize: this.totalSize,
      overflow: false,
    });
  }

  private overflowWindow<TItem>({
    items,
    viewportSize,
    fallbackViewportSize = 0,
    reserveSize = 0,
  }: Extract<ListWindowOptions<TItem>, { mode: "overflow" }>): ListWindow<TItem> {
    if (items.length === 0) {
      return emptyWindow<TItem>();
    }
    const available = viewportSize > 0 ? viewportSize : Math.max(0, fallbackViewportSize);
    const full = this.range({
      scrollOffset: 0,
      viewportSize: available,
      fallbackViewportSize: 0,
      overscan: 0,
      includePartial: false,
    });
    if (full.end >= items.length) {
      return buildWindow({
        items,
        start: 0,
        end: items.length,
        offset: 0,
        totalSize: this.offsetOf(items.length),
        overflow: false,
      });
    }
    const fitted = this.range({
      scrollOffset: 0,
      viewportSize: Math.max(0, available - Math.max(0, reserveSize)),
      fallbackViewportSize: 0,
      overscan: 0,
      includePartial: false,
    });
    const end = Math.min(items.length, fitted.end);
    return buildWindow({
      items,
      start: 0,
      end,
      offset: 0,
      totalSize: this.offsetOf(end),
      overflow: true,
    });
  }

  private range({
    scrollOffset,
    viewportSize,
    fallbackViewportSize,
    overscan,
    includePartial,
  }: RangeOptions): WindowRange {
    const viewport = viewportSize > 0 ? viewportSize : Math.max(0, fallbackViewportSize);
    const offset = Math.max(0, scrollOffset);
    const first = this.indexAt(offset);
    const end = Math.min(this.count, this.bound(offset + viewport, includePartial));
    const extra = Number.isFinite(overscan) ? Math.max(0, Math.floor(overscan)) : 0;
    return { start: Math.max(0, first - extra), end: Math.min(this.count, end + extra) };
  }

  private setTotal(total: number): void {
    const next = Math.max(0, Math.floor(total));
    if (next === this.count) {
      return;
    }
    for (const index of this.measured.keys()) {
      if (index >= next) {
        this.measured.delete(index);
      }
    }
    this.count = next;
    this.rebuild();
  }

  private sizeOf(index: number): number {
    return this.measured.get(index) ?? this.estimate;
  }

  private get totalSize(): number {
    return this.offsets[this.count] ?? 0;
  }

  private offsetOf(index: number): number {
    const clamped = Math.min(Math.max(index, 0), this.count);
    return this.offsets[clamped] ?? 0;
  }

  private rebuild(): void {
    this.offsets.length = this.count + 1;
    this.offsets[0] = 0;
    for (let index = 0; index < this.count; index += 1) {
      this.offsets[index + 1] = (this.offsets[index] ?? 0) + this.sizeOf(index);
    }
  }

  private indexAt(offset: number): number {
    let low = 0;
    let high = Math.max(0, this.count - 1);
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if ((this.offsets[middle] ?? 0) <= offset) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return low;
  }

  private bound(limit: number, partial: boolean): number {
    let low = 0;
    let high = this.count;
    if (partial) {
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if ((this.offsets[middle] ?? 0) < limit) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      return low;
    }
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if ((this.offsets[middle] ?? 0) <= limit) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    return low;
  }
}
export interface ScrollIndexOptions {
  viewport: HTMLElement | undefined;
  index: number;
  metrics: ListMetrics;
  onScrollTo: (top: number, height: number) => void;
}

/**
 * Scrolls the item at `index` into view. When the row is outside the rendered
 * window its measured offset is used to move the viewport instead.
 */
export function scrollIndexIntoView({
  viewport,
  index,
  metrics,
  onScrollTo,
}: ScrollIndexOptions): void {
  if (index < 0 || viewport === undefined) {
    return;
  }
  const row = viewport.querySelector<HTMLElement>(`[role="option"][data-index="${index}"]`);
  if (row !== null) {
    row.scrollIntoView({ block: "nearest" });
    return;
  }
  const next = metrics.reveal({
    index,
    scrollOffset: viewport.scrollTop,
    viewportSize: viewport.clientHeight,
  });
  if (next !== undefined) {
    viewport.scrollTop = next;
    onScrollTo(next, viewport.clientHeight);
  }
}
