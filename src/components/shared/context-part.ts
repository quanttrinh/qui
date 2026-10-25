import { Build, forceUpdate } from "@stencil/core";

// Keep provider keys in sync with COMPONENT_PRIORITY in src/unplugin/core.ts.
/** A provider key shared by a context family. */
type ContextPartKey = "accordion" | "accordion-item" | "dialog" | "field" | "radio-group" | "tabs";

/** A context object that can notify a subscribed part when it changes. */
interface ContextPartSource {
  subscribe: (listener: () => void) => () => void;
}

interface ConsumeContextPartOptions<TContext extends ContextPartSource> {
  /** Resolves the host lazily so the controller can be created in the constructor. */
  host: () => HTMLElement;
  /** The provider key to listen for while waiting to attach. */
  key: ContextPartKey;
  /** Finds the nearest matching ancestor context. */
  consume: (host: HTMLElement) => TContext | undefined;
  /** Optional side effect when a context is attached. Returns a teardown. */
  setup?: (context: TContext) => (() => void) | undefined;
  /**
   * Extension point for parts that need custom update behavior. Defaults to
   * `forceUpdate(host)` when omitted.
   */
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

// Notifications are scoped by context family, not by provider host.
// Each matching provider wakes every consumer of that family.
// Consumers re-walk ancestors, which is O(consumers x depth) at mount time.
// Attach is a no-op for the current context.
// A provider-to-consumer index would be more complex than this is worth.
const contextChangedListeners = new Map<ContextPartKey, Set<() => void>>();
const pendingKeys = new Set<ContextPartKey>();
let flushScheduled = false;

function notifyKey(key: ContextPartKey, errors: unknown[]): void {
  const listeners = contextChangedListeners.get(key);
  if (listeners !== undefined) {
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        errors.push(error);
      }
    }
  }
}

function flushNotifications(): void {
  const errors: unknown[] = [];
  try {
    // Drain iteratively so nested-provider notifications never recurse per item.
    while (pendingKeys.size > 0) {
      const keys = [...pendingKeys];
      pendingKeys.clear();
      for (const key of keys) {
        notifyKey(key, errors);
      }
    }
  } finally {
    flushScheduled = false;
  }
  if (errors.length > 0) {
    throw errors[0];
  }
}

/**
 * Notifies waiting parts that context availability for `key` changed.
 * Providers call this after storing or clearing their context.
 *
 * Components are defined in an arbitrary order, so a part can upgrade before
 * its provider. Those parts attach when this notification arrives instead of
 * depending on custom element registration order.
 */
function notifyContextChanged(key: ContextPartKey): void {
  if (Build.isServer) {
    return;
  }
  pendingKeys.add(key);
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  queueMicrotask(flushNotifications);
}

/** Subscribes to provider notifications for `key`. Returns an unsubscribe function. */
function onContextProvided(key: ContextPartKey, listener: () => void): () => void {
  if (Build.isServer) {
    return (): void => undefined;
  }
  let listeners = contextChangedListeners.get(key);
  if (listeners === undefined) {
    listeners = new Set();
    contextChangedListeners.set(key, listeners);
  }
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
    if (listeners.size === 0 && contextChangedListeners.get(key) === listeners) {
      contextChangedListeners.delete(key);
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
  let loaded = false;

  const detach = (): void => {
    unsubscribe?.();
    unsubscribe = undefined;
    teardown?.();
    teardown = undefined;
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

  const updateAttached = (): void => {
    if (context === undefined) {
      forceUpdate(options.host());
    } else {
      requestUpdate(context);
    }
  };

  const handleProvided = (): void => {
    if (attach()) {
      updateAttached();
    }
  };

  const start = (): boolean => {
    stopListening ??= onContextProvided(options.key, handleProvided);
    return attach();
  };

  const hostDidLoad = (): void => {
    loaded = true;
    if (attach()) {
      updateAttached();
    }
  };

  return {
    get context(): TContext | undefined {
      return context;
    },
    hostConnected: (): void => {
      if (start() && loaded) {
        updateAttached();
      }
    },
    hostWillLoad: (): void => {
      start();
    },
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
  notifyContextChanged,
  onContextProvided,
  type ContextPart,
  type ContextPartKey,
  type ContextPartSource,
};
