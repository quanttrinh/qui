/** One rendered element and its index in the source list. */
interface MeasuredItem {
  element: Element;
  index: number;
}

interface ListSizeObserverOptions {
  /** Called with every measured item height. Return whether anything changed. */
  onMeasured: (index: number, size: number) => boolean;
  /** Called after a resize changes a measured size, so the owner can re-render. */
  onResize?: () => void;
}

function measureElement(element: Element): number {
  if (!(element instanceof HTMLElement)) {
    return 0;
  }
  return element.getBoundingClientRect().height;
}

/**
 * Tracks rendered list rows with a single `ResizeObserver`. Call `sync` after
 * each render with the rows that are currently in the DOM.
 */
export class ListSizeObserver {
  private readonly onMeasured: (index: number, size: number) => boolean;
  private readonly onResize?: () => void;
  private readonly observer?: ResizeObserver;
  private readonly elements = new Map<Element, number>();

  constructor({ onMeasured, onResize }: ListSizeObserverOptions) {
    this.onMeasured = onMeasured;
    this.onResize = onResize;
    if (typeof ResizeObserver === "function") {
      this.observer = new ResizeObserver((entries) => {
        this.handleEntries(entries);
      });
    }
  }

  /**
   * Observes the current rows and measures newly seen ones immediately.
   * Returns whether a measured size changed the list layout.
   */
  public sync(items: Iterable<MeasuredItem>): boolean {
    const next = new Map<Element, number>();
    for (const item of items) {
      next.set(item.element, item.index);
    }
    for (const element of this.elements.keys()) {
      if (!next.has(element)) {
        this.observer?.unobserve(element);
      }
    }
    let changed = false;
    for (const [element, index] of next) {
      if (this.elements.get(element) !== index) {
        this.observer?.observe(element);
        changed = this.report(element, index) || changed;
      }
    }
    this.elements.clear();
    for (const [element, index] of next) {
      this.elements.set(element, index);
    }
    return changed;
  }

  public disconnect(): void {
    this.observer?.disconnect();
    this.elements.clear();
  }

  private handleEntries(entries: readonly ResizeObserverEntry[]): void {
    let changed = false;
    for (const entry of entries) {
      const index = this.elements.get(entry.target);
      if (index !== undefined) {
        changed = this.report(entry.target, index) || changed;
      }
    }
    if (changed) {
      this.onResize?.();
    }
  }

  private report(element: Element, index: number): boolean {
    const size = measureElement(element);
    return size > 0 && this.onMeasured(index, size);
  }
}
