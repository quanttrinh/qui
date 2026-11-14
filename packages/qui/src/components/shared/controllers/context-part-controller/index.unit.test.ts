import { describe, expect, it, vi } from "vitest";

import { type ContextSource } from "../../context/store";
import { type ReactiveControllerHost } from "../reactive-controller";
import { ContextPartController, type ContextPartOptions, type ContextPartSource } from "./index";

interface TestContext extends ContextPartSource {
  name: string;
  notify: () => void;
  listenerCount: () => number;
}

interface SourceState {
  current?: TestContext;
}

function createContext(name: string): TestContext {
  const listeners = new Set<() => void>();
  return {
    name,
    subscribe: (listener: () => void) => {
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
    listenerCount: () => listeners.size,
  };
}

function createSource(state: SourceState): ContextSource<TestContext> & {
  notify: () => void;
  listenerCount: () => number;
} {
  const listeners = new Set<() => void>();
  return {
    consume: () => state.current,
    onProvided: (_host, listener) => {
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
    listenerCount: () => listeners.size,
  };
}

function createHost(): HTMLElement {
  return {
    parentElement: null,
    getRootNode: () => ({ nodeType: 1 }),
  } as unknown as HTMLElement;
}

function createPart<TContext extends ContextPartSource>(
  options: ContextPartOptions<TContext>,
  hostElement: HTMLElement = createHost(),
): ContextPartController<TContext> {
  const host: ReactiveControllerHost = {
    hostElement,
    addController: (): void => undefined,
    removeController: (): void => undefined,
    requestUpdate: (): void => undefined,
  };
  return new ContextPartController(host, options);
}

describe("ContextPartController lifecycle", () => {
  it("attaches, subscribes, and detaches", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: createSource(state), update });

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
    const context = createContext("field");
    const state: SourceState = { current: context };
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: createSource(state), setup });

    part.hostWillLoad();
    expect(setup).toHaveBeenCalledWith(context);
    part.hostDisconnected();
    expect(teardown).toHaveBeenCalledOnce();
  });

  it("retries once after render when the context was not available", () => {
    const context = createContext("field");
    const state: SourceState = {};
    const part = createPart({ context: createSource(state) });

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    state.current = context;
    part.hostDidLoad();
    expect(part.context).toBe(context);
    expect(context.listenerCount()).toBe(1);
    part.hostDisconnected();
  });

  it("reattaches and re-renders after a reconnect with a new provider", () => {
    const first = createContext("first");
    const second = createContext("second");
    const state: SourceState = { current: first };
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: createSource(state), update });

    part.hostWillLoad();
    part.hostDidLoad();
    part.hostDisconnected();
    expect(part.context).toBeUndefined();
    expect(first.listenerCount()).toBe(0);

    state.current = second;
    part.hostConnected();
    expect(part.context).toBe(second);
    expect(second.listenerCount()).toBe(1);
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });

  it("can skip the subscription for one-shot consumers", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: createSource(state), subscribe: false, update });

    part.hostWillLoad();
    context.notify();
    expect(update).not.toHaveBeenCalled();
    expect(context.listenerCount()).toBe(0);
    part.hostDisconnected();
  });
});

describe("ContextPartController selector subscriptions", () => {
  it("notifies only when the selected snapshot changes", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({
      context: source,
      select: () => context.name,
      update,
    });

    part.hostWillLoad();
    expect(update).not.toHaveBeenCalled();

    context.notify();
    expect(update).not.toHaveBeenCalled();

    context.name = "changed";
    context.notify();
    expect(update).toHaveBeenCalledOnce();

    context.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });

  it("uses a custom equality for selected snapshots", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const equals = vi.fn((previous: unknown, next: unknown): boolean => {
      const left = previous as [string, number];
      const right = next as [string, number];
      return left[0] === right[0];
    });
    let revision = 1;
    const part = createPart({
      context: source,
      select: () => [context.name, revision] as const,
      equals,
      update,
    });

    part.hostWillLoad();
    revision = 2;
    context.notify();
    expect(update).not.toHaveBeenCalled();

    context.name = "changed";
    context.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });

  it("uses shallowEqual by default for flat array snapshots", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({
      context: source,
      select: () => [context.name, true],
      update,
    });

    part.hostWillLoad();
    context.notify();
    expect(update).not.toHaveBeenCalled();

    context.name = "changed";
    context.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });

  it("skips selector work when subscriptions are disabled", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const select = vi.fn(() => [context.name]);
    const update = vi.fn((): void => undefined);
    const part = createPart({
      context: source,
      select,
      subscribe: false,
      update,
    });

    part.hostWillLoad();
    context.notify();

    expect(select).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    part.hostDisconnected();
  });

  it("applies selector filtering to custom update handlers", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({
      context: source,
      select: () => context.name,
      update,
    });

    part.hostWillLoad();
    context.notify();
    expect(update).not.toHaveBeenCalled();

    context.name = "changed";
    context.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });

  it("recaptures the snapshot after reattaching", () => {
    const first = createContext("first");
    const second = createContext("second");
    const state: SourceState = { current: first };
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({
      context: source,
      select: () => state.current?.name,
      update,
    });

    part.hostWillLoad();
    part.hostDidLoad();
    part.hostDisconnected();

    state.current = second;
    part.hostConnected();
    expect(update).toHaveBeenCalledOnce();

    second.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
  });
});

describe("ContextPartController provider notifications", () => {
  it("attaches when a provider is registered after the first render", () => {
    const context = createContext("field");
    const state: SourceState = {};
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source, update });

    part.hostWillLoad();
    part.hostDidLoad();
    expect(part.context).toBeUndefined();

    state.current = context;
    source.notify();

    expect(part.context).toBe(context);
    expect(update).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(1);

    source.notify();
    expect(update).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(1);
    part.hostDisconnected();
  });

  it("stops listening after disconnect", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const part = createPart({ context: source });

    part.hostWillLoad();
    part.hostDisconnected();
    expect(source.listenerCount()).toBe(0);

    state.current = createContext("replacement");
    source.notify();
    expect(part.context).toBeUndefined();
  });

  it("updates one-shot consumers when their provider appears", () => {
    const context = createContext("field");
    const state: SourceState = {};
    const source = createSource(state);
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source, subscribe: false, update });

    part.hostWillLoad();
    state.current = context;
    source.notify();

    expect(part.context).toBe(context);
    expect(update).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(0);
    part.hostDisconnected();
  });

  it("replaces the context and tears down the previous one", () => {
    const first = createContext("first");
    const second = createContext("second");
    const state: SourceState = { current: first };
    const source = createSource(state);
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: source, setup });

    part.hostWillLoad();
    expect(first.listenerCount()).toBe(1);

    state.current = second;
    source.notify();

    expect(part.context).toBe(second);
    expect(teardown).toHaveBeenCalledOnce();
    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBe(1);
    expect(setup).toHaveBeenLastCalledWith(second);
    part.hostDisconnected();
  });

  it("detaches when the provider disappears", () => {
    const context = createContext("field");
    const state: SourceState = { current: context };
    const source = createSource(state);
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: source, setup });

    part.hostWillLoad();
    state.current = undefined;
    source.notify();

    expect(part.context).toBeUndefined();
    expect(teardown).toHaveBeenCalledOnce();
    expect(context.listenerCount()).toBe(0);
    part.hostDisconnected();
  });
});
