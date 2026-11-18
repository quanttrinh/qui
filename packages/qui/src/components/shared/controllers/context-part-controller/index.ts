import type { Context, ContextCallback } from "../../context";
import type { ReactiveControllerHost } from "../reactive-controller";

import { requestContext } from "../../context";
import { shallowEqual } from "../../helpers/equality";
import { ReactiveControllerBase } from "../reactive-controller";

export interface ContextPartOptions<TContext, TSelection = unknown> {
  /** The context key to request. */
  context: Context<unknown, TContext>;
  /** Side effect on attach; returns a teardown. */
  setup?: (context: TContext) => (() => void) | undefined;
  /** Custom update handler; defaults to a host render. */
  update?: (context: TContext) => void;
  /** Whether to receive value updates. Defaults to `true`. */
  subscribe?: boolean;
  /** Rendered-value snapshot; updates only when it changes. */
  select?: (context: TContext) => TSelection;
  /** Compare snapshots. Defaults to `shallowEqual`. */
  equals?: (previous: TSelection, next: TSelection) => boolean;
  /** Runs on every provider notification, even if the selector filtered a render. */
  onNotify?: (context: TContext) => void;
}

/** Subscribes a part to its nearest provider via `context-request`. */
class ContextPartController<TContext, TSelection = unknown> extends ReactiveControllerBase {
  private readonly options: ContextPartOptions<TContext, TSelection>;
  private attached: TContext | undefined;
  private unsubscribe?: () => void;
  private teardown?: () => void;
  private selection: { value: TSelection } | undefined;
  private requested = false;
  private starting = false;

  constructor(host: ReactiveControllerHost, options: ContextPartOptions<TContext, TSelection>) {
    super(host);
    this.options = options;
  }

  /** The nearest ancestor context, or `undefined` while waiting for a provider. */
  get context(): TContext | undefined {
    return this.attached;
  }

  hostConnected(): void {
    this.start(false);
  }

  hostWillLoad(): void {
    this.start(true);
  }

  hostDisconnected(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.teardown?.();
    this.teardown = undefined;
    this.attached = undefined;
    this.selection = undefined;
    this.requested = false;
  }

  private readonly handleValue: ContextCallback<TContext | undefined> = (context, unsubscribe) => {
    if (unsubscribe !== this.unsubscribe) {
      this.unsubscribe?.();
      this.unsubscribe = unsubscribe;
    }
    const changed = !Object.is(context, this.attached);
    if (changed) {
      this.teardown?.();
      this.teardown = undefined;
      this.attached = context;
      this.teardown = context === undefined ? undefined : this.options.setup?.(context);
      const { select, subscribe } = this.options;
      this.selection =
        context === undefined || select === undefined || subscribe === false
          ? undefined
          : { value: select(context) };
    }
    // Skip the synchronous answer before the first render.
    if (!this.starting && this.attached !== undefined) {
      // New contexts always notify; same-context updates use the selector.
      if (changed) {
        this.notify(this.attached);
      } else {
        this.handleNotification(this.attached);
      }
    }
  };

  private readonly notifySelected = (
    context: TContext,
    select: (context: TContext) => TSelection,
  ): void => {
    const { equals = shallowEqual } = this.options;
    const next = select(context);
    if (this.selection !== undefined && equals(this.selection.value, next)) {
      return;
    }
    this.selection = { value: next };
    this.notify(context);
  };

  private handleNotification(context: TContext): void {
    // Forward filtered notifications so nested providers can wake their subscribers.
    this.options.onNotify?.(context);
    const { select } = this.options;
    if (select === undefined) {
      this.notify(context);
    } else {
      this.notifySelected(context, select);
    }
  }

  private notify(context: TContext): void {
    const { update } = this.options;
    if (update === undefined) {
      this.requestUpdate();
    } else {
      update(context);
    }
  }

  private start(silent: boolean): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
    this.starting = silent;
    try {
      requestContext(
        this.hostElement,
        this.options.context,
        this.handleValue,
        this.options.subscribe !== false,
      );
    } finally {
      this.starting = false;
    }
  }
}

export { ContextPartController };
