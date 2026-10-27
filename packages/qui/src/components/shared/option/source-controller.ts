import { Build } from "@stencil/core";

import { type ReactiveController } from "../reactive-control/controller";
import { type OptionItem } from "./option";

/** DOM-specific half of an option source. Kept outside shared code. */
export interface OptionSourceAdapter {
  /** MutationObserver config for the host. */
  observerInit: MutationObserverInit;
  /** Reads the current items from the host. */
  read: (host: HTMLElement) => OptionItem[];
}

interface OptionSourceControllerOptions {
  getHost: () => HTMLElement;
  getItems: () => readonly OptionItem[] | undefined;
  getRenderedRoot: () => HTMLElement | undefined;
  adapter: OptionSourceAdapter;
  requestUpdate: () => void;
  onInvalidate?: () => void;
}

/**
 * Supplies options from the `items` property or from a DOM source, keeping the
 * source in sync with a MutationObserver. The adapter owns all knowledge of the
 * concrete option element.
 */
export class OptionSourceController implements ReactiveController {
  private readonly options: OptionSourceControllerOptions;
  private dirty = true;
  private cached: OptionItem[] = [];
  private observer?: MutationObserver;

  constructor(options: OptionSourceControllerOptions) {
    this.options = options;
  }

  public get items(): readonly OptionItem[] {
    const items = this.options.getItems();
    if (items !== undefined) {
      return items;
    }
    if (this.dirty) {
      this.cached = this.options.adapter.read(this.options.getHost());
      this.dirty = false;
    }
    return this.cached;
  }

  public invalidate(): void {
    this.dirty = true;
  }

  public hostConnected(): void {
    this.dirty = true;
    this.observe();
  }

  public hostDidLoad(): void {
    this.observe();
  }

  public hostDisconnected(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private observe(): void {
    if (this.observer !== undefined || !Build.isBrowser) {
      return;
    }
    const { adapter } = this.options;
    const host = this.options.getHost();
    this.observer = new MutationObserver((records) => {
      const root = this.options.getRenderedRoot();
      if (
        records.every(
          (record) =>
            root?.contains(record.target) === true ||
            (record.type === "attributes" && record.target === host),
        )
      ) {
        return;
      }
      this.dirty = true;
      this.options.onInvalidate?.();
      this.options.requestUpdate();
    });
    this.observer.observe(this.options.getHost(), adapter.observerInit);
  }
}
