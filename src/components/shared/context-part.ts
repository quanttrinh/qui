import { forceUpdate } from "@stencil/core";

/** A context object that can notify a subscribed part when it changes. */
interface ContextPartSource {
  subscribe: (listener: () => void) => () => void;
}

interface ConsumeContextPartOptions<TContext extends ContextPartSource> {
  /** Resolves the host lazily so the controller can be created in the constructor. */
  host: () => HTMLElement;
  /** Finds the nearest matching ancestor context. */
  consume: (host: HTMLElement) => TContext | undefined;
  /** Optional side effect when a context is attached. Returns a teardown. */
  setup?: (context: TContext) => (() => void) | undefined;
  /** Called when the attached context changes. Defaults to `forceUpdate(host)`. */
  update?: (context: TContext) => void;
  /** Whether to re-render on context changes. Defaults to `true`. */
  subscribe?: boolean;
}

interface ContextPart<TContext extends ContextPartSource> {
  readonly context: TContext | undefined;
  /** Attach during `componentWillLoad`. */
  hostWillLoad: () => void;
  /** Retry once after the first render, for late-mounted ancestors. */
  hostDidLoad: () => void;
  /** Detach during `disconnectedCallback`. */
  hostDisconnected: () => void;
}

const contextProvidedListeners = new Set<() => void>();

/**
 * Notifies waiting parts that an ancestor context has been provided.
 *
 * Components are defined in an arbitrary order, so a part can upgrade before
 * its provider. Providers call this after storing their context so those parts
 * can attach without depending on custom element registration order.
 */
function notifyContextProvided(): void {
  for (const listener of contextProvidedListeners) {
    listener();
  }
}

/** Subscribes to provider notifications. Returns an unsubscribe function. */
function onContextProvided(listener: () => void): () => void {
  contextProvidedListeners.add(listener);
  return (): void => {
    contextProvidedListeners.delete(listener);
  };
}

/**
 * Connects a part component to its nearest ancestor context and handles the
 * retry, subscription, and teardown lifecycle that every context part repeats.
 */
function consumeContextPart<TContext extends ContextPartSource>(
  options: ConsumeContextPartOptions<TContext>,
): ContextPart<TContext> {
  let context: TContext | undefined = undefined;
  let unsubscribe: (() => void) | undefined = undefined;
  let teardown: (() => void) | undefined = undefined;
  let stopListening: (() => void) | undefined = undefined;

  const detach = (): void => {
    teardown?.();
    teardown = undefined;
    unsubscribe?.();
    unsubscribe = undefined;
  };

  const requestUpdate = (next: TContext): void => {
    if (options.update === undefined) {
      forceUpdate(options.host());
    } else {
      options.update(next);
    }
  };

  const attach = (): boolean => {
    const next = options.consume(options.host());
    if (next === undefined || next === context) {
      return false;
    }
    detach();
    context = next;
    teardown = options.setup?.(next);
    if (options.subscribe !== false) {
      unsubscribe = next.subscribe(() => {
        requestUpdate(next);
      });
    }
    return true;
  };

  const handleProvided = (): void => {
    if (attach() && context !== undefined) {
      requestUpdate(context);
    }
  };

  const hostWillLoad = (): void => {
    stopListening ??= onContextProvided(handleProvided);
    attach();
  };

  const hostDidLoad = (): void => {
    if (attach()) {
      forceUpdate(options.host());
    }
  };

  return {
    get context(): TContext | undefined {
      return context;
    },
    hostWillLoad,
    hostDidLoad,
    hostDisconnected: (): void => {
      stopListening?.();
      stopListening = undefined;
      detach();
    },
  };
}

export {
  consumeContextPart,
  notifyContextProvided,
  onContextProvided,
  type ContextPart,
  type ContextPartSource,
};
