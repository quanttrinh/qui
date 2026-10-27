/** A set of change listeners shared by a provider and its subscribed parts. */
export interface ListenerStore {
  /** Adds a listener. Returns an idempotent unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** Calls every listener synchronously in registration order. */
  notify: () => void;
  /** Removes every listener. */
  clear: () => void;
}

/**
 * Creates the listener bookkeeping used by context providers.
 *
 * Notifications stay synchronous and unordered relative to any other provider
 * work; callers keep their existing notify ordering. Listener errors propagate
 * to the caller, matching the providers' previous direct Set iteration.
 */
export function createListenerStore(): ListenerStore {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
    notify: () => {
      for (const listener of listeners) {
        listener();
      }
    },
    clear: () => {
      listeners.clear();
    },
  };
}
