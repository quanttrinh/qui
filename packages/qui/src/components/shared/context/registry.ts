import type { Context, ContextCallback, UnknownContext } from "./protocol";

import { createContextProviderEvent, createContextRequestEvent } from "./protocol";

interface Subscriber {
  readonly unsubscribe: () => void;
  callback: WeakRef<ContextCallback<unknown>>;
  host: WeakRef<Element>;
}

interface ContextSlot {
  value: unknown;
  readonly subscribers: Set<Subscriber>;
  readonly controller: AbortController;
  readonly listener: (event: ElementEventMap["context-request"]) => void;
}

const providers = new WeakMap<Element, Map<UnknownContext, ContextSlot>>();

/** Adds or reuses a subscription. */
function subscribeConsumer(slot: ContextSlot, event: ElementEventMap["context-request"]): void {
  const { callback: subscriber } = event;
  let entry: Subscriber | undefined;
  for (const candidate of slot.subscribers) {
    if (candidate.callback.deref() === subscriber) {
      entry = candidate;
      break;
    }
  }
  if (entry === undefined) {
    const created: Subscriber = {
      unsubscribe: (): void => {
        slot.subscribers.delete(created);
      },
      callback: new WeakRef(subscriber),
      host: new WeakRef(event.contextTarget),
    };
    entry = created;
    slot.subscribers.add(created);
  } else {
    entry.host = new WeakRef(event.contextTarget);
  }
  subscriber(slot.value, entry.unsubscribe);
}

interface PendingRequest {
  host: WeakRef<Element>;
  callback: WeakRef<ContextCallback<unknown>>;
  subscribe: boolean;
}

interface RootState {
  pending: Map<UnknownContext, Set<PendingRequest>>;
}

const roots = new WeakMap<Document, RootState>();

/** Drops an answered request from the late-provider queue. */
function settlePending(
  context: UnknownContext,
  host: Element,
  // oxlint-disable-next-line promise/prefer-await-to-callbacks -- Callbacks are the protocol contract.
  callback: ContextCallback<unknown>,
): void {
  const document = host.ownerDocument;
  const state = document === null ? undefined : roots.get(document);
  const entries = state?.pending.get(context);
  if (state === undefined || entries === undefined) {
    return;
  }
  for (const entry of entries) {
    if (entry.host.deref() === host && entry.callback.deref() === callback) {
      entries.delete(entry);
      break;
    }
  }
  if (entries.size === 0) {
    state.pending.delete(context);
  }
}

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
    let entries = state.pending.get(event.context);
    if (entries === undefined) {
      entries = new Set();
      state.pending.set(event.context, entries);
    }
    // Prune collected entries and skip duplicates.
    for (const entry of entries) {
      const pendingHost = entry.host.deref();
      const pendingCallback = entry.callback.deref();
      if (pendingHost === undefined || pendingCallback === undefined) {
        entries.delete(entry);
      } else if (pendingHost === host && pendingCallback === event.callback) {
        return;
      }
    }
    entries.add({
      host: new WeakRef(host),
      callback: new WeakRef(event.callback),
      subscribe: event.subscribe,
    });
  });

  target.addEventListener("context-provider", (event): void => {
    if (!event.available) {
      return;
    }
    const entries = state.pending.get(event.context);
    if (entries === undefined) {
      return;
    }
    // Snapshot: answering mutates the set.
    // oxlint-disable-next-line unicorn/no-useless-spread -- Snapshot before nested announcements mutate the set.
    for (const entry of [...entries]) {
      // A nested announcement may have settled this entry.
      if (entries.has(entry)) {
        const host = entry.host.deref();
        const callback = entry.callback.deref();
        if (host !== undefined && callback !== undefined) {
          host.dispatchEvent(
            createContextRequestEvent(event.context, callback, entry.subscribe, host),
          );
        } else {
          entries.delete(entry);
        }
      }
    }
    if (entries.size === 0) {
      state.pending.delete(event.context);
    }
  });

  return state;
}

function ensureRoot(host: Element): void {
  if (host.ownerDocument !== null) {
    rootFor(host.ownerDocument);
  }
}

/** Notifies a live subscriber; prunes collected ones. */
function notifySubscriber(slot: ContextSlot, subscriber: Subscriber, value: unknown): void {
  const notify = subscriber.callback.deref();
  if (notify === undefined) {
    // Weak refs keep forgotten consumers collectable.
    slot.subscribers.delete(subscriber);
    return;
  }
  notify(value, subscriber.unsubscribe);
}

/** Invalidates a subscriber and requests a fallback provider. */
function invalidateSubscriber(context: UnknownContext, subscriber: Subscriber): void {
  const notify = subscriber.callback.deref();
  const subscriberHost = subscriber.host.deref();
  if (notify === undefined) {
    return;
  }
  // undefined signals provider removal.
  notify(undefined);
  if (subscriberHost !== undefined) {
    subscriberHost.dispatchEvent(createContextRequestEvent(context, notify, true, subscriberHost));
  }
}

/** Notifies subscribers that the provider state changed. */
export function notifyContext<Value>(host: Element, context: Context<unknown, Value>): void {
  const slot = providers.get(host)?.get(context);
  if (slot === undefined) {
    return;
  }
  const { value } = slot;
  let firstError: unknown;
  for (const subscriber of slot.subscribers) {
    try {
      notifySubscriber(slot, subscriber, value);
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
  // mock-doc ignores `signal`, so remove the listener explicitly.
  host.removeEventListener("context-request", slot.listener);
  slot.controller.abort();
  const subscribers = [...slot.subscribers];
  slot.subscribers.clear();
  let firstError: unknown;
  for (const subscriber of subscribers) {
    try {
      invalidateSubscriber(context, subscriber);
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

/** Updates an existing slot; returns false when the provider has no slot. */
function publishValue<Value>(
  host: Element,
  context: Context<unknown, Value>,
  value: Value,
): boolean {
  const slot = providers.get(host)?.get(context);
  if (slot === undefined) {
    return false;
  }
  if (!Object.is(slot.value, value)) {
    slot.value = value;
    notifyContext(host, context);
  }
  return true;
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
      if (!publishValue(host, context, next)) {
        provideContext(host, context, next);
      }
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
      // Answered here; no late-provider wake needed.
      settlePending(context, event.contextTarget, event.callback);
      if (!event.subscribe) {
        // Protocol: non-subscribing callbacks must not be retained.
        event.callback(current.value);
        return;
      }
      subscribeConsumer(current, event);
    };
    host.addEventListener("context-request", listener, { signal: controller.signal });
    slot = { value, controller, listener, subscribers: new Set() };
    byContext.set(context, slot);
    // Wake consumers that requested this context before the provider existed.
    host.dispatchEvent(createContextProviderEvent(context, host, true));
    return handle;
  }
  publishValue(host, context, value);
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
