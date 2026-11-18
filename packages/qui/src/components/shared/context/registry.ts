import type {
  Context,
  ContextCallback,
  UnknownContext,
} from "./protocol";

import { createContextProviderEvent, createContextRequestEvent } from "./protocol";

interface Subscriber {
  unsubscribe: () => void;
  host: Element;
  subscribe: boolean;
}

/** One provider's value and subscriptions; values are typed at the public API boundary. */
class ContextSlot {
  readonly subscribers = new Map<ContextCallback<unknown>, Subscriber>();
  readonly controller: AbortController;
  readonly listener: (event: ElementEventMap["context-request"]) => void;
  private current: unknown;

  constructor(
    value: unknown,
    controller: AbortController,
    listener: (event: ElementEventMap["context-request"]) => void,
  ) {
    this.controller = controller;
    this.listener = listener;
    this.current = value;
  }

  get(): unknown {
    return this.current;
  }

  set(value: unknown): void {
    this.current = value;
  }
}

const providers = new WeakMap<Element, Map<UnknownContext, ContextSlot>>();

interface PendingRequest {
  context: UnknownContext;
  host: WeakRef<Element>;
  callback: WeakRef<ContextCallback<unknown>>;
  subscribe: boolean;
}

interface RootState {
  pending: Map<UnknownContext, PendingRequest[]>;
}

const roots = new WeakMap<Document, RootState>();

/** Late-provider discovery for one document. */
function rootFor(target: Document): RootState {
  const existing = roots.get(target);
  if (existing !== undefined) {
    return existing;
  }
  const state: RootState = { pending: new Map() };
  roots.set(target, state);

  target.addEventListener("context-request", (event): void => {
    const host = event.contextTarget;
    const list = state.pending.get(event.context) ?? [];
    // Compact dead entries in place; otherwise the list grows forever.
    let live = 0;
    for (const entry of list) {
      if (entry.host.deref() !== undefined && entry.callback.deref() !== undefined) {
        list[live] = entry;
        live += 1;
      }
    }
    list.length = live;
    const alreadyPending = list.some(
      (entry) => entry.host.deref() === host && entry.callback.deref() === event.callback,
    );
    if (!alreadyPending) {
      list.push({
        context: event.context,
        host: new WeakRef(host),
        callback: new WeakRef(event.callback),
        subscribe: event.subscribe,
      });
      state.pending.set(event.context, list);
    }
  });

  target.addEventListener("context-provider", (event): void => {
    if (!event.available) {
      return;
    }
    const list = state.pending.get(event.context);
    if (list === undefined) {
      return;
    }
    for (const entry of list) {
      const host = entry.host.deref();
      const callback = entry.callback.deref();
      if (host !== undefined && callback !== undefined) {
        host.dispatchEvent(createContextRequestEvent(event.context, callback, entry.subscribe, host));
      }
    }
  });

  return state;
}

function ensureRoot(host: Element): void {
  if (host.ownerDocument !== null) {
    rootFor(host.ownerDocument);
  }
}

/** Notifies all current subscribers that a provider's state changed. */
export function notifyContext<Value>(host: Element, context: Context<unknown, Value>): void {
  const slot = providers.get(host)?.get(context);
  if (slot === undefined) {
    return;
  }
  let firstError: unknown;
  for (const [notify, subscriber] of slot.subscribers) {
    try {
      notify(slot.get(), subscriber.unsubscribe);
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError !== undefined) {
    throw firstError instanceof Error
      ? firstError
      : new Error("Context provider notification failed", { cause: firstError });
  }
}

/** Removes a context from `host` and invalidates every subscribed consumer. */
export function clearContext<Value>(host: Element, context: Context<unknown, Value>): void {
  const byContext = providers.get(host);
  const slot = byContext?.get(context);
  if (slot === undefined || byContext === undefined) {
    return;
  }
  byContext.delete(context);
  // mock-doc (SSR) ignores `signal`, so remove the listener explicitly too.
  host.removeEventListener("context-request", slot.listener);
  slot.controller.abort();
  const subscribers = [...slot.subscribers];
  slot.subscribers.clear();
  let firstError: unknown;
  for (const [notify, subscriber] of subscribers) {
    try {
      // Extension: undefined signals provider removal.
      notify(undefined);
      // Let consumers fall back to a more distant provider of the same context.
      subscriber.host.dispatchEvent(
        createContextRequestEvent(context, notify, subscriber.subscribe, subscriber.host),
      );
    } catch (error) {
      firstError ??= error;
    }
  }
  host.dispatchEvent(createContextProviderEvent(context, host, false));
  if (byContext.size === 0) {
    providers.delete(host);
  }
  if (firstError !== undefined) {
    throw firstError instanceof Error
      ? firstError
      : new Error("Context provider cleanup failed", { cause: firstError });
  }
}

/** Provider-side handle for updating or retiring a context. */
export interface ContextProviderHandle<Value> {
  /** Publish a changed value. */
  readonly setValue: (value: Value) => void;
  /** Notify subscribers of in-place state changes. */
  readonly notify: () => void;
  /** Remove the context and invalidate subscribers. */
  readonly clear: () => void;
}

/** Publishes a context value on `host` and answers descendant requests. */
export function provideContext<Value>(
  host: Element,
  context: Context<unknown, Value>,
  value: Value,
): ContextProviderHandle<Value> {
  const handle: ContextProviderHandle<Value> = {
    setValue: (next: Value): void => {
      provideContext(host, context, next);
    },
    notify: (): void => {
      notifyContext(host, context);
    },
    clear: (): void => {
      clearContext(host, context);
    },
  };
  ensureRoot(host);
  let byContext = providers.get(host);
  if (byContext === undefined) {
    byContext = new Map();
    providers.set(host, byContext);
  }
  let slot = byContext.get(context);
  if (slot === undefined) {
    const controller = new AbortController();
    const listener = (event: ElementEventMap["context-request"]): void => {
      if (event.context !== context || event.contextTarget === host) {
        return;
      }
      // Stop first: a throwing callback must not let a distant provider answer.
      event.stopImmediatePropagation();
      const current = byContext.get(context);
      if (current === undefined) {
        return;
      }
      if (!event.subscribe) {
        // Protocol: non-subscribing callbacks must not be retained.
        event.callback(current.get());
        return;
      }
      const { callback: subscriber } = event;
      const unsubscribe = (): void => {
        current.subscribers.delete(subscriber);
      };
      current.subscribers.set(subscriber, {
        unsubscribe,
        host: event.contextTarget,
        subscribe: event.subscribe,
      });
      subscriber(current.get(), unsubscribe);
    };
    host.addEventListener("context-request", listener, { signal: controller.signal });
    slot = new ContextSlot(value, controller, listener);
    byContext.set(context, slot);
    // Wake consumers that requested this context before the provider existed.
    host.dispatchEvent(createContextProviderEvent(context, host, true));
    return handle;
  }
  if (!Object.is(slot.get(), value)) {
    slot.set(value);
    notifyContext(host, context);
  }
  return handle;
}

/** Synchronous one-shot read, used by imperative consumers. */
export function consumeOnce<Value>(
  host: Element,
  context: Context<unknown, Value>,
): Value | undefined {
  let value: Value | undefined;
  host.dispatchEvent(
    createContextRequestEvent<Value>(
      context,
      (next) => {
        value = next;
      },
      false,
      host,
    ),
  );
  return value;
}

/** Fires a request. Requests are retained so late providers can answer them. */
export function requestContext<Value>(
  host: Element,
  context: Context<unknown, Value>,
  callback: ContextCallback<Value | undefined>,
  subscribe: boolean,
): void {
  ensureRoot(host);
  host.dispatchEvent(
    createContextRequestEvent<Value | undefined>(context, callback, subscribe, host),
  );
}
