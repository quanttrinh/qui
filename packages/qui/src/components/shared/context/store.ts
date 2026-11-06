import { Build } from "@stencil/core";

import { isShadowRoot } from "../helpers/dom/dom";

// Context parts retry when a provider is defined or upgraded later, so component
// Registration order does not need to be tracked separately.
/** A provider key shared by a context family. */
type ContextPartKey = "accordion" | "accordion-item" | "dialog" | "field" | "radio-group" | "tabs";

interface ContextListener {
  host: Element;
  notify: () => void;
}

// Notifications are routed to consumers inside the provider's subtree. A
// Sibling provider therefore never wakes an unrelated form/accordion tree.
const contextChangedListeners = new Map<ContextPartKey, Set<ContextListener>>();
const pendingProviders = new Map<ContextPartKey, Set<Element | undefined>>();
let flushScheduled = false;

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : undefined;
}

/** Whether `node` is `ancestor` or lives inside its subtree, across shadow roots. */
function isDescendant(node: Element, ancestor: Element): boolean {
  const contains = Reflect.get(ancestor, "contains");
  if (typeof contains === "function" && Reflect.apply(contains, ancestor, [node]) === true) {
    return true;
  }
  let current: Element | undefined = node;
  while (current !== undefined) {
    if (current === ancestor) {
      return true;
    }
    current = parentElement(current);
  }
  return false;
}

interface NotificationState {
  errors: unknown[];
  notified: Set<ContextListener>;
}

function notifyProvider(
  key: ContextPartKey,
  provider: Element | undefined,
  state: NotificationState,
): void {
  const listeners = contextChangedListeners.get(key);
  if (listeners === undefined) {
    return;
  }
  for (const entry of listeners) {
    if (
      !state.notified.has(entry) &&
      (provider === undefined || isDescendant(entry.host, provider))
    ) {
      state.notified.add(entry);
      try {
        entry.notify();
      } catch (error) {
        state.errors.push(error);
      }
    }
  }
}

function flushNotifications(): void {
  const state: NotificationState = { errors: [], notified: new Set() };
  try {
    // Drain iteratively so nested-provider notifications never recurse per item.
    while (pendingProviders.size > 0) {
      const providers = [...pendingProviders];
      pendingProviders.clear();
      for (const [key, hosts] of providers) {
        for (const host of hosts) {
          notifyProvider(key, host, state);
        }
      }
    }
  } finally {
    flushScheduled = false;
  }
  if (state.errors.length > 0) {
    throw state.errors[0];
  }
}

/**
 * Notifies waiting parts in `provider`'s subtree that context availability for
 * `key` changed. Providers call this after storing or clearing their context.
 *
 * Components are defined in an arbitrary order, so a part can upgrade before
 * its provider. Those parts attach when this notification arrives instead of
 * depending on custom element registration order.
 */
function notifyContextChanged(key: ContextPartKey, provider?: Element): void {
  if (Build.isServer) {
    return;
  }
  let providers = pendingProviders.get(key);
  if (providers === undefined) {
    providers = new Set();
    pendingProviders.set(key, providers);
  }
  providers.add(provider);
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  queueMicrotask(flushNotifications);
}

/**
 * Subscribes a consumer host to provider notifications for `key`. Returns an
 * unsubscribe function. Notifications only wake consumers inside the changed
 * provider's subtree.
 */
function onContextProvided(key: ContextPartKey, host: Element, listener: () => void): () => void {
  if (Build.isServer) {
    return () => undefined;
  }
  let listeners = contextChangedListeners.get(key);
  if (listeners === undefined) {
    listeners = new Set();
    contextChangedListeners.set(key, listeners);
  }
  const entry: ContextListener = { host, notify: listener };
  listeners.add(entry);
  return () => {
    listeners.delete(entry);
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
      notifyContextChanged(key, host);
    },
    clear: (host: Element) => {
      contexts.delete(host);
      notifyContextChanged(key, host);
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
