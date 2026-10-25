import { describe, expect, it, vi } from "vitest";

import { consumeContextPart } from "./context-part";

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

describe("consumeContextPart", () => {
  it("attaches, subscribes, and detaches", () => {
    const context = createContext();
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: createHost,
      consume: () => context,
      update,
    });

    part.hostWillLoad();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);

    context.notify();
    expect(update).toHaveBeenCalledOnce();

    part.hostDisconnected();
    expect(part.context).toBe(context);
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
      consume: () => state.current,
    });

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    state.current = context;
    part.hostDidLoad();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);
  });

  it("can skip the subscription for one-shot consumers", () => {
    const context = createContext();
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: createHost,
      consume: () => context,
      subscribe: false,
      update,
    });

    part.hostWillLoad();
    context.notify();
    expect(update).not.toHaveBeenCalled();
    expect(context.listenerCount()).toBe(0);
  });
});
