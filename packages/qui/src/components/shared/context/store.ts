import { Build } from "@stencil/core";

import { isShadowRoot } from "../helpers/dom/dom";

interface ContextListener {
  host: Element;
  notify: () => void;
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : undefined;
}

/** Whether `node` is `ancestor` or lives inside its subtree, across shadow roots. */
function hasChangedProvider(node: Element, providers: Set<Element | undefined>): boolean {
  let current: Element | undefined = node;
  while (current !== undefined) {
    if (providers.has(current)) {
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

interface PendingStore {
  flush: () => void;
}

const pendingStores = new Set<PendingStore>();
let flushScheduled = false;

function flushPendingStores(): void {
  let firstError: Error | undefined;
  try {
    while (pendingStores.size > 0) {
      const stores = [...pendingStores];
      pendingStores.clear();
      for (const store of stores) {
        try {
          store.flush();
        } catch (error) {
          firstError ??= error instanceof Error ? error : new Error(String(error));
        }
      }
    }
  } finally {
    flushScheduled = false;
  }
  if (firstError !== undefined) {
    throw firstError;
  }
}

/** The consumer side of one context family. */
export interface ContextSource<TContext> {
  /** Find the closest ancestor context, crossing shadow boundaries. */
  consume: (host: Element) => TContext | undefined;
  /** Subscribe a consumer to provider availability changes. */
  onProvided: (host: Element, listener: () => void) => () => void;
}

/** One independent context family, identified by the store instance itself. */
export interface ContextStore<TContext> extends ContextSource<TContext> {
  /** Attach a context to its provider host. */
  provide: (host: Element, context: TContext) => void;
  /** Remove the context from a provider host. */
  clear: (host: Element) => void;
}

class ContextStoreImpl<TContext> implements ContextStore<TContext> {
  private readonly contexts = new WeakMap<Element, TContext>();
  private readonly listeners = new Set<ContextListener>();
  private readonly pendingProviders = new Set<Element | undefined>();

  readonly provide = (host: Element, context: TContext): void => {
    this.contexts.set(host, context);
    this.schedule(host);
  };

  readonly clear = (host: Element): void => {
    this.contexts.delete(host);
    this.schedule(host);
  };

  readonly consume = (host: Element): TContext | undefined => {
    let node = parentElement(host);
    while (node !== undefined) {
      const context = this.contexts.get(node);
      if (context !== undefined) {
        return context;
      }
      node = parentElement(node);
    }
    return undefined;
  };

  readonly onProvided = (host: Element, listener: () => void): (() => void) => {
    if (Build.isServer) {
      return () => undefined;
    }
    const entry: ContextListener = { host, notify: listener };
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  };

  private schedule(provider: Element | undefined): void {
    if (Build.isServer) {
      return;
    }
    this.pendingProviders.add(provider);
    pendingStores.add(this);
    if (flushScheduled) {
      return;
    }
    flushScheduled = true;
    queueMicrotask(flushPendingStores);
  }

  readonly flush = (): void => {
    const state: NotificationState = { errors: [], notified: new Set() };
    while (this.pendingProviders.size > 0) {
      const providers = new Set(this.pendingProviders);
      this.pendingProviders.clear();
      this.notifyProviders(providers, state);
    }
    if (state.errors.length > 0) {
      throw state.errors[0];
    }
  };

  private notifyProviders(providers: Set<Element | undefined>, state: NotificationState): void {
    const notifyAll = providers.has(undefined);
    for (const entry of this.listeners) {
      if (!state.notified.has(entry) && (notifyAll || hasChangedProvider(entry.host, providers))) {
        state.notified.add(entry);
        try {
          entry.notify();
        } catch (error) {
          state.errors.push(error);
        }
      }
    }
  }
}

/**
 * Creates an independent context family. The returned store owns its WeakMap,
 * ancestor walk, listeners, and notification batching, so adding a new context
 * family never requires editing shared context code.
 */
export function createContextStore<TContext>(): ContextStore<TContext> {
  return new ContextStoreImpl<TContext>();
}
