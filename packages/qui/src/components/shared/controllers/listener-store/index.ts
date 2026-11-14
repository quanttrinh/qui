/** A set of change listeners shared by a provider and its subscribed parts. */
export interface ListenerStore {
  /** Adds a listener. Returns an idempotent unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** Calls every listener. */
  notify: () => void;
  /** Removes every listener. */
  clear: () => void;
}

/**
 * Creates the listener bookkeeping used by context providers.
 *
 * Parts decide whether a notification changes their rendered state, so
 * providers can notify unconditionally without computing changed keys.
 */
export function createListenerStore(): ListenerStore {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
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
