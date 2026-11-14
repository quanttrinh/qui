/** A set of change listeners shared by a provider and its subscribed parts. */
export interface ListenerStore<TKey extends string = string> {
  /**
   * Adds a listener. Keyed listeners only run for notifications that include
   * their current key; the getter is read at notification time so a part can
   * change its key without re-subscribing. Returns an idempotent unsubscribe
   * function.
   */
  subscribe: (listener: () => void, key?: () => TKey | undefined) => () => void;
  /**
   * Calls every unkeyed listener and every keyed listener whose current key is
   * included in `keys`. Omitting `keys` notifies every listener.
   */
  notify: (keys?: Iterable<TKey>) => void;
  /** Removes every listener. */
  clear: () => void;
}

/**
 * Creates the listener bookkeeping used by context providers.
 *
 * Providers can scope a notification to the values whose state changed, so a
 * large accordion or radio group only re-renders the affected parts.
 *
 * Notifications stay synchronous and unordered relative to any other provider
 * work; callers keep their existing notify ordering. Listener errors propagate
 * to the caller, matching the providers' previous direct Set iteration.
 */
export function createListenerStore<TKey extends string = string>(): ListenerStore<TKey> {
  const listeners = new Map<() => void, (() => TKey | undefined) | undefined>();
  return {
    subscribe: (listener, key) => {
      listeners.set(listener, key);
      return () => {
        listeners.delete(listener);
      };
    },
    notify: (keys) => {
      const changed = keys === undefined ? undefined : new Set(keys);
      for (const [listener, key] of listeners) {
        if (changed === undefined || key === undefined) {
          listener();
        } else {
          const value = key();
          if (value !== undefined && changed.has(value)) {
            listener();
          }
        }
      }
    },
    clear: () => {
      listeners.clear();
    },
  };
}
