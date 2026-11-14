import { type ContextSource } from "../../context/store";
import { shallowEqual } from "../../helpers/collection";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../reactive-controller";

/** A context object that can notify a subscribed part when it changes. */
interface ContextPartSource {
  subscribe: (listener: () => void) => () => void;
}

interface ContextPartOptions<TContext extends ContextPartSource> {
  /** The context family to consume. */
  context: ContextSource<TContext>;
  /** Optional side effect when a context is attached. Returns a teardown. */
  setup?: (context: TContext) => (() => void) | undefined;
  /**
   * Extension point for parts that need custom update behavior. Defaults to
   * scheduling a host render when omitted.
   */
  update?: (context: TContext) => void;
  /** Whether to re-render on context changes. Defaults to `true`. */
  subscribe?: boolean;
  /**
   * Snapshot of the context values this part renders. When provided, provider
   * notifications only re-render the part when the snapshot changes.
   */
  select?: (context: TContext) => unknown;
  /** Compare selector snapshots. Defaults to `shallowEqual`. */
  equals?: (previous: unknown, next: unknown) => boolean;
}

/**
 * Connects a part component to its nearest ancestor context and handles the
 * retry, subscription, and teardown lifecycle that every context part repeats.
 */
class ContextPartController<TContext extends ContextPartSource> extends ReactiveControllerBase {
  private readonly options: ContextPartOptions<TContext>;
  private attached: TContext | undefined;
  private unsubscribe?: () => void;
  private teardown?: () => void;
  private stopListening?: () => void;
  private selection: unknown;
  private hasSelection = false;
  private loaded = false;

  constructor(host: ReactiveControllerHost, options: ContextPartOptions<TContext>) {
    super(host);
    this.options = options;
  }

  /** The nearest ancestor context, or `undefined` while waiting for a provider. */
  get context(): TContext | undefined {
    return this.attached;
  }

  hostConnected(): void {
    const started = this.start();
    if (started && this.loaded) {
      this.updateAttached();
    }
  }

  hostWillLoad(): void {
    this.start();
  }

  hostDidLoad(): void {
    this.loaded = true;
    if (this.attach()) {
      this.updateAttached();
    }
  }

  hostDisconnected(): void {
    this.stopListening?.();
    this.stopListening = undefined;
    this.detach();
    this.attached = undefined;
  }

  private readonly detach = (): void => {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.teardown?.();
    this.teardown = undefined;
    this.selection = undefined;
    this.hasSelection = false;
  };

  private readonly notifySelected = (context: TContext): void => {
    const { select, equals = shallowEqual } = this.options;
    if (select === undefined) {
      this.notify(context);
      return;
    }
    const next = select(context);
    if (this.hasSelection && equals(this.selection, next)) {
      return;
    }
    this.selection = next;
    this.hasSelection = true;
    this.notify(context);
  };

  private notify(context: TContext): void {
    if (this.options.update === undefined) {
      this.requestUpdate();
    } else {
      this.options.update(context);
    }
  }

  private attach(): boolean {
    const next = this.options.context.consume(this.hostElement);
    if (next === this.attached) {
      return false;
    }
    this.detach();
    this.attached = next;
    if (next === undefined) {
      return true;
    }
    this.teardown = this.options.setup?.(next);
    if (this.options.subscribe !== false) {
      if (this.options.select === undefined) {
        this.unsubscribe = next.subscribe(() => {
          this.notify(next);
        });
      } else {
        this.selection = this.options.select(next);
        this.hasSelection = true;
        this.unsubscribe = next.subscribe(() => {
          this.notifySelected(next);
        });
      }
    }
    return true;
  }

  private updateAttached(): void {
    if (this.attached === undefined) {
      this.requestUpdate();
    } else {
      this.notify(this.attached);
    }
  }

  private readonly handleProvided = (): void => {
    if (this.attach()) {
      this.updateAttached();
    }
  };

  private start(): boolean {
    this.stopListening ??= this.options.context.onProvided(this.hostElement, this.handleProvided);
    return this.attach();
  }
}

export { ContextPartController, type ContextPartOptions, type ContextPartSource };
