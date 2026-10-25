import { describe, expect, it, vi } from "vitest";

import { consumeContextPart, notifyContextProvided, onContextProvided } from "./context-part";

const KEY = "field";

function createContext() {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
    notify: (): void => {
      for (const listener of listeners) {
        listener();
      }
    },
    listenerCount: (): number => listeners.size,
  };
}

function createHost(): HTMLElement {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {} as HTMLElement;
}

async function flush(): Promise<void> {
  await Promise.resolve();
}

describe("consumeContextPart lifecycle", () => {
  it("attaches, subscribes, and detaches", () => {
    const context = createContext();
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => context,
      update,
    });

    part.hostWillLoad();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);

    context.notify();
    expect(update).toHaveBeenCalledOnce();

    part.hostDisconnected();
    expect(part.context).toBeUndefined();
    expect(context.listenerCount()).toBe(0);

    context.notify();
    expect(update).toHaveBeenCalledOnce();
  });

  it("runs setup and teardown around the subscription", () => {
    const context = createContext();
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => context,
      setup,
    });

    part.hostWillLoad();
    expect(setup).toHaveBeenCalledWith(context);
    part.hostDisconnected();
    expect(teardown).toHaveBeenCalledOnce();
  });

  it("retries once after render when the context was not available", () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = {};
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
    });

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    state.current = context;
    part.hostDidLoad();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);
    part.hostDisconnected();
  });

  it("reattaches after a reconnect", () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = { current: context };
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
    });

    part.hostWillLoad();
    part.hostDisconnected();
    expect(part.context).toBeUndefined();
    expect(context.listenerCount()).toBe(0);

    part.hostConnected();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);
    part.hostDisconnected();
  });

  it("can skip the subscription for one-shot consumers", () => {
    const context = createContext();
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => context,
      subscribe: false,
      update,
    });

    part.hostWillLoad();
    context.notify();
    expect(update).not.toHaveBeenCalled();
    expect(context.listenerCount()).toBe(0);
    part.hostDisconnected();
  });
});

describe("consumeContextPart provider notifications", () => {
  it("attaches when a provider is registered after the first render", async () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = {};
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
      update,
    });

    part.hostWillLoad();
    part.hostDidLoad();
    expect(part.context).toBeUndefined();

    state.current = context;
    notifyContextProvided(KEY);
    await flush();

    expect(part.context).toBe(context);
    expect(update).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(1);

    notifyContextProvided(KEY);
    await flush();
    expect(update).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(1);
    part.hostDisconnected();
  });

  it("stops listening after disconnect", async () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = { current: context };
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
    });

    part.hostWillLoad();
    part.hostDisconnected();
    state.current = createContext();
    notifyContextProvided(KEY);
    await flush();

    expect(part.context).toBeUndefined();
  });

  it("ignores notifications for other provider keys", async () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = {};
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
    });

    part.hostWillLoad();
    state.current = context;
    notifyContextProvided("dialog");
    await flush();

    expect(part.context).toBeUndefined();

    notifyContextProvided(KEY);
    await flush();
    expect(part.context).toBe(context);
    part.hostDisconnected();
  });

  it("keeps a newer listener set when an old unsubscribe runs twice", async () => {
    const stale = onContextProvided(
      KEY,
      vi.fn((): void => undefined),
    );
    stale();
    const listener = vi.fn((): void => undefined);
    const unsubscribe = onContextProvided(KEY, listener);

    stale();
    notifyContextProvided(KEY);
    await flush();

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("coalesces notifications for the same provider key", async () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = {};
    const consume = vi.fn(() => state.current);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume,
    });

    part.hostWillLoad();
    state.current = context;
    consume.mockClear();

    notifyContextProvided(KEY);
    notifyContextProvided(KEY);
    notifyContextProvided(KEY);
    await flush();

    expect(consume).toHaveBeenCalledOnce();
    expect(part.context).toBe(context);
    part.hostDisconnected();
  });

  it("replaces the context and tears down the previous one", async () => {
    const first = createContext();
    const second = createContext();
    const state: { current?: ReturnType<typeof createContext> } = { current: first };
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
      setup,
    });

    part.hostWillLoad();
    expect(first.listenerCount()).toBe(1);

    state.current = second;
    notifyContextProvided(KEY);
    await flush();

    expect(part.context).toBe(second);
    expect(teardown).toHaveBeenCalledOnce();
    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBe(1);
    expect(setup).toHaveBeenLastCalledWith(second);
    part.hostDisconnected();
  });

  it("detaches when the provider disappears", async () => {
    const context = createContext();
    const state: { current?: ReturnType<typeof createContext> } = { current: context };
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = consumeContextPart({
      host: createHost,
      key: KEY,
      consume: () => state.current,
      setup,
    });

    part.hostWillLoad();
    state.current = undefined;
    notifyContextProvided(KEY);
    await flush();

    expect(part.context).toBeUndefined();
    expect(teardown).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(0);
    part.hostDisconnected();
  });
});
