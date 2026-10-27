import { describe, expect, it, vi } from "vitest";

import { createListenerStore } from "./listener-store";

describe("createListenerStore", () => {
  it("notifies every listener synchronously in registration order", () => {
    const store = createListenerStore();
    const calls: string[] = [];

    store.subscribe(() => {
      calls.push("first");
    });
    store.subscribe(() => {
      calls.push("second");
    });

    store.notify();
    expect(calls).toEqual(["first", "second"]);

    calls.length = 0;
    store.notify();
    expect(calls).toEqual(["first", "second"]);
  });

  it("stops notifying after unsubscribe", () => {
    const store = createListenerStore();
    const listener = vi.fn((): void => undefined);
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.notify();
    expect(listener).not.toHaveBeenCalled();
  });

  it("allows unsubscribing more than once", () => {
    const store = createListenerStore();
    const listener = vi.fn((): void => undefined);
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    expect(() => {
      unsubscribe();
    }).not.toThrow();
    store.notify();
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears every listener", () => {
    const store = createListenerStore();
    const first = vi.fn((): void => undefined);
    const second = vi.fn((): void => undefined);
    store.subscribe(first);
    store.subscribe(second);

    store.clear();
    store.notify();

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it("accepts new subscriptions after clear", () => {
    const store = createListenerStore();
    const listener = vi.fn((): void => undefined);
    store.subscribe(vi.fn((): void => undefined));
    store.clear();

    store.subscribe(listener);
    store.notify();

    expect(listener).toHaveBeenCalledOnce();
  });

  it("visits listeners added during the current notification", () => {
    const store = createListenerStore();
    const late = vi.fn((): void => undefined);

    store.subscribe(() => {
      store.subscribe(late);
    });
    store.notify();

    expect(late).toHaveBeenCalledOnce();
  });

  it("skips listeners removed before they are visited", () => {
    const store = createListenerStore();
    const second = vi.fn((): void => undefined);
    const ref: { unsubscribe?: () => void } = {};

    store.subscribe(() => {
      ref.unsubscribe?.();
    });
    ref.unsubscribe = store.subscribe(second);
    store.notify();

    expect(second).not.toHaveBeenCalled();
  });

  it("propagates listener errors synchronously and stops the loop", () => {
    const store = createListenerStore();
    const after = vi.fn((): void => undefined);
    const error = new Error("listener failed");

    store.subscribe(() => {
      throw error;
    });
    store.subscribe(after);

    expect(() => {
      store.notify();
    }).toThrow(error);
    expect(after).not.toHaveBeenCalled();
  });
});
