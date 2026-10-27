import { type ReactiveController } from "../reactive-control/controller";
import { ListMetrics, scrollIndexIntoView, type ListMode, type ListWindow } from "./model";
import { ListSizeObserver } from "./size-observer";

interface ListWindowControllerOptions {
  getEstimateSize: () => number;
  fallbackViewportSize: number;
  getOverscan: () => number;
  requestUpdate: () => void;
}

interface ListWindowOverrides {
  mode?: ListMode;
  reserveSize?: number;
  /** Available height for overflow mode, or to override the measured viewport. */
  viewportSize?: number;
}

/**
 * Owns list windowing: measured offsets, scroll offset, viewport, reveal, and
 * both virtualization and overflow window computation.
 */
export class ListWindowController implements ReactiveController {
  private readonly options: ListWindowControllerOptions;
  private readonly metrics: ListMetrics;
  private readonly sizeObserver: ListSizeObserver;
  private offset = 0;
  private viewport?: HTMLElement;
  private viewportObserver?: ResizeObserver;

  constructor(options: ListWindowControllerOptions) {
    this.options = options;
    this.metrics = new ListMetrics({ estimate: options.getEstimateSize() });
    this.sizeObserver = new ListSizeObserver({
      onMeasured: (index: number, size: number): boolean => this.metrics.setSize(index, size),
      onResize: (): void => {
        this.options.requestUpdate();
      },
    });
  }

  public getList<TItem>(
    items: readonly TItem[],
    { mode = "virtualize", reserveSize = 0, viewportSize = 0 }: ListWindowOverrides = {},
  ): ListWindow<TItem> {
    this.metrics.setEstimate(this.options.getEstimateSize());
    const measuredViewport = viewportSize > 0 ? viewportSize : (this.viewport?.clientHeight ?? 0);
    if (mode === "overflow") {
      return this.metrics.window({
        mode: "overflow",
        items,
        viewportSize: measuredViewport,
        fallbackViewportSize: this.options.fallbackViewportSize,
        reserveSize,
      });
    }
    return this.metrics.window({
      mode: "virtualize",
      items,
      viewportSize: measuredViewport,
      fallbackViewportSize: this.options.fallbackViewportSize,
      scrollOffset: this.offset,
      overscan: this.options.getOverscan(),
    });
  }

  public setViewport(element: HTMLElement | undefined): void {
    if (element === this.viewport) {
      return;
    }
    this.viewportObserver?.disconnect();
    this.viewportObserver = undefined;
    this.viewport = element;
    if (element !== undefined && typeof ResizeObserver === "function") {
      this.viewportObserver = new ResizeObserver(() => {
        this.options.requestUpdate();
      });
      this.viewportObserver.observe(element);
    }
  }

  public scrollToStart(): void {
    const changed = this.offset !== 0 || (this.viewport?.scrollTop ?? 0) !== 0;
    this.offset = 0;
    if (this.viewport !== undefined) {
      this.viewport.scrollTop = 0;
    }
    if (changed) {
      this.options.requestUpdate();
    }
  }

  public revealIndex(index: number): void {
    if (index < 0) {
      return;
    }
    scrollIndexIntoView({
      viewport: this.viewport,
      index,
      metrics: this.metrics,
      onScrollTo: (top) => {
        this.offset = top;
        this.options.requestUpdate();
      },
    });
  }

  public handleScroll(): void {
    const { viewport } = this;
    if (viewport !== undefined && viewport.scrollTop !== this.offset) {
      this.offset = viewport.scrollTop;
      this.options.requestUpdate();
    }
  }

  public hostDidRender(): void {
    if (this.sizeObserver.sync(this.renderedRows())) {
      this.options.requestUpdate();
    }
  }

  public hostDisconnected(): void {
    this.sizeObserver.disconnect();
    this.viewportObserver?.disconnect();
    this.viewportObserver = undefined;
    this.viewport = undefined;
    this.offset = 0;
  }

  private renderedRows(): { element: Element; index: number }[] {
    if (this.viewport === undefined) {
      return [];
    }
    return [...this.viewport.querySelectorAll<HTMLElement>('[role="option"][data-index]')]
      .map((element) => ({ element, index: Number(element.dataset.index) }))
      .filter(({ index }) => Number.isInteger(index) && index >= 0);
  }
}
