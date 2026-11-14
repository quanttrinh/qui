import { ensureShadowStylesheet } from "../../../../utilities/styles";
import { onContextProvided, type ContextPartKey } from "../../context/store";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../reactive-controller";

/** A context object that can notify a subscribed part when it changes. */
interface ContextPartSource {
  subscribe: (listener: () => void, key?: () => string | undefined) => () => void;
}

interface ContextPartOptions<TContext extends ContextPartSource> {
  /** The provider key to listen for while waiting to attach. */
  key: ContextPartKey;
  /** Finds the nearest matching ancestor context. */
  consume: (host: HTMLElement) => TContext | undefined;
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
   * The value this part cares about. When the provider's listener store is
   * keyed, notifications for other values skip this part.
   */
  getKey?: () => string | undefined;
  /** Whether to ensure the shadow stylesheet on connect. Defaults to `true`. */
  styles?: boolean;
}

/**
 * Connects a part component to its nearest ancestor context and handles the
 * retry, subscription, and teardown lifecycle that every context part repeats.
 */
class ContextPartController<TContext extends ContextPartSource> extends ReactiveControllerBase {
  private readonly options: ContextPartOptions<TContext>;
  private attached: TContext | undefined;
  private unsubscribe?: () => void;
  private teardown?: (() => void) | undefined;
  private stopListening?: () => void;
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
    if (this.options.styles !== false) {
      ensureShadowStylesheet(this.hostElement);
    }
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
  };

  private notify(context: TContext): void {
    if (this.options.update === undefined) {
      this.requestUpdate();
    } else {
      this.options.update(context);
    }
  }

  private attach(): boolean {
    const next = this.options.consume(this.hostElement);
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
      this.unsubscribe = next.subscribe(() => {
        this.notify(next);
      }, this.options.getKey);
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
    this.stopListening ??= onContextProvided(
      this.options.key,
      this.hostElement,
      this.handleProvided,
    );
    return this.attach();
  }
}

export { ContextPartController, type ContextPartOptions, type ContextPartSource };
