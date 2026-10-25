import { forceUpdate } from "@stencil/core";

/** A context object that can notify a subscribed part when it changes. */
interface ContextPartSource {
  subscribe: (listener: () => void) => () => void;
}

interface ConsumeContextPartOptions<TContext extends ContextPartSource> {
  /** Resolves the host lazily so the controller can be created in the constructor. */
  host: () => HTMLElement;
  /** The provider key to listen for while waiting to attach. */
  key: string;
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
  /** Attach again after the host is reconnected. */
  hostConnected: () => void;
  /** Attach during `componentWillLoad`. */
  hostWillLoad: () => void;
  /** Retry once after the first render, for late-mounted ancestors. */
  hostDidLoad: () => void;
  /** Detach during `disconnectedCallback`. */
  hostDisconnected: () => void;
}

const contextProvidedListeners = new Map<string, Set<() => void>>();
const pendingKeys = new Set<string>();
let flushScheduled = false;

function notifyKey(key: string): void {
  const listeners = contextProvidedListeners.get(key);
  if (listeners !== undefined) {
    for (const listener of listeners) {
      listener();
    }
  }
}

function flushNotifications(): void {
  try {
    // Drain iteratively so nested-provider notifications never recurse per item.
    while (pendingKeys.size > 0) {
      const keys = [...pendingKeys];
      pendingKeys.clear();
      for (const key of keys) {
        notifyKey(key);
      }
    }
  } finally {
    flushScheduled = false;
  }
}

/**
 * Notifies waiting parts that an ancestor context for `key` was provided.
 *
 * Components are defined in an arbitrary order, so a part can upgrade before
 * its provider. Providers call this after storing their context so those parts
 * can attach without depending on custom element registration order.
 */
function notifyContextProvided(key: string): void {
  pendingKeys.add(key);
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  queueMicrotask(flushNotifications);
}

/** Subscribes to provider notifications for `key`. Returns an unsubscribe function. */
function onContextProvided(key: string, listener: () => void): () => void {
  let listeners = contextProvidedListeners.get(key);
  if (listeners === undefined) {
    listeners = new Set();
    contextProvidedListeners.set(key, listeners);
  }
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      contextProvidedListeners.delete(key);
    }
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
    if (next === context) {
      return false;
    }
    detach();
    context = next;
    if (next === undefined) {
      return true;
    }
    teardown = options.setup?.(next);
    if (options.subscribe !== false) {
      unsubscribe = next.subscribe(() => {
        requestUpdate(next);
      });
    }
    return true;
  };

  const handleProvided = (): void => {
    if (!attach()) {
      return;
    }
    if (context === undefined) {
      forceUpdate(options.host());
    } else {
      requestUpdate(context);
    }
  };

  const start = (): void => {
    stopListening ??= onContextProvided(options.key, handleProvided);
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
    hostConnected: start,
    hostWillLoad: start,
    hostDidLoad,
    hostDisconnected: (): void => {
      stopListening?.();
      stopListening = undefined;
      detach();
      context = undefined;
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
