import { Build } from "@stencil/core";

import { type OptionItem } from "../../../helpers/option/option";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../../reactive-controller";

/** DOM-specific half of an option source. Kept outside shared code. */
export interface OptionSourceAdapter {
  /** MutationObserver config for the host. */
  observerInit: MutationObserverInit;
  /** Reads the current items from the host. */
  read: (host: HTMLElement) => OptionItem[];
}

interface OptionSourceControllerOptions {
  getItems: () => readonly OptionItem[] | undefined;
  getRenderedRoot: () => HTMLElement | undefined;
  adapter: OptionSourceAdapter;
  onInvalidate?: () => void;
}

/**
 * Supplies options from the `items` property or from a DOM source, keeping the
 * source in sync with a MutationObserver. The adapter owns all knowledge of the
 * concrete option element.
 */
export class OptionSourceController extends ReactiveControllerBase {
  private readonly options: OptionSourceControllerOptions;
  private dirty = true;
  private cached: OptionItem[] = [];
  private observer?: MutationObserver;

  constructor(host: ReactiveControllerHost, options: OptionSourceControllerOptions) {
    super(host);
    this.options = options;
  }

  get items(): readonly OptionItem[] {
    const items = this.options.getItems();
    if (items !== undefined) {
      return items;
    }
    if (this.dirty) {
      this.cached = this.options.adapter.read(this.hostElement);
      this.dirty = false;
    }
    return this.cached;
  }

  invalidate(): void {
    this.dirty = true;
  }

  hostConnected(): void {
    this.dirty = true;
    this.observe();
  }

  hostDidLoad(): void {
    this.observe();
  }

  hostDisconnected(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private observe(): void {
    if (this.observer !== undefined || !Build.isBrowser) {
      return;
    }
    const { adapter } = this.options;
    const host = this.hostElement;
    this.observer = new MutationObserver((records) => {
      const root = this.options.getRenderedRoot();
      if (
        records.every(
          (record) =>
            Boolean(root?.contains(record.target)) ||
            (record.type === "attributes" && record.target === host),
        )
      ) {
        return;
      }
      this.dirty = true;
      this.options.onInvalidate?.();
      this.requestUpdate();
    });
    this.observer.observe(this.hostElement, adapter.observerInit);
  }
}
