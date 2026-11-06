import { Build } from "@stencil/core";

import { isShadowRoot } from "../helpers/dom/dom";

// Context parts retry when a provider is defined or upgraded later, so component
// Registration order does not need to be tracked separately.
/** A provider key shared by a context family. */
type ContextPartKey = "accordion" | "accordion-item" | "dialog" | "field" | "radio-group" | "tabs";

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
    return () => undefined;
  }
  let listeners = contextChangedListeners.get(key);
  if (listeners === undefined) {
    listeners = new Set();
    contextChangedListeners.set(key, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && contextChangedListeners.get(key) === listeners) {
      contextChangedListeners.delete(key);
    }
  };
}

/** Provides and consumes one family of context through the DOM tree. */
interface ContextStore<TContext> {
  /** Attach a context to its provider host. */
  provide: (host: Element, context: TContext) => void;
  /** Remove the context from a provider host. */
  clear: (host: Element) => void;
  /** Find the closest ancestor context, crossing shadow boundaries. */
  consume: (host: Element) => TContext | undefined;
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : undefined;
}

/**
 * Creates a context store scoped to one provider key. The store owns the
 * WeakMap, the ancestor walk, and provider notifications so each context
 * module only declares its context type.
 */
function createContextStore<TContext>(key: ContextPartKey): ContextStore<TContext> {
  const contexts = new WeakMap<Element, TContext>();

  return {
    provide: (host: Element, context: TContext) => {
      contexts.set(host, context);
      notifyContextChanged(key);
    },
    clear: (host: Element) => {
      contexts.delete(host);
      notifyContextChanged(key);
    },
    consume: (host: Element) => {
      let node = parentElement(host);
      while (node !== undefined) {
        const context = contexts.get(node);
        if (context !== undefined) {
          return context;
        }
        node = parentElement(node);
      }
      return undefined;
    },
  };
}

export {
  createContextStore,
  notifyContextChanged,
  onContextProvided,
  type ContextPartKey,
  type ContextStore,
};
