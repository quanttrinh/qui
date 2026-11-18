import { describe, expect, it, vi } from "vitest";

import type { ReactiveControllerHost } from "../reactive-controller";
import type { ContextPartOptions } from "./index";

import { clearContext, createContext, notifyContext, provideContext } from "../../context";
import { createTree, cleanup } from "../../../../../tests/test-utils/context-dom";
import { ContextPartController } from "./index";

interface TestContext {
  name: string;
}

function createContextValue(name: string): TestContext {
  return { name };
}

function createSource(initial?: TestContext) {
  const { provider, consumer } = createTree();
  const key = createContext<TestContext>(Symbol("part-test"));
  if (initial !== undefined) {
    provideContext(provider, key, initial);
  }
  return {
    key,
    host: consumer,
    set(value: TestContext | undefined): void {
      if (value === undefined) {
        clearContext(provider, key);
      } else {
        provideContext(provider, key, value);
      }
    },
    notify(): void {
      notifyContext(provider, key);
    },
    cleanup(): void {
      cleanup(provider);
    },
  };
}

function createPart<TContext, TSelection = unknown>(
  options: ContextPartOptions<TContext, TSelection>,
  hostElement: HTMLElement,
): ContextPartController<TContext, TSelection> {
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
    const source = createSource(createContextValue("field"));
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, update }, source.host);

    part.hostWillLoad();
    expect(part.context?.name).toBe("field");

    source.notify();
    expect(update).toHaveBeenCalledOnce();

    part.hostDisconnected();
    expect(part.context).toBeUndefined();

    source.notify();
    expect(update).toHaveBeenCalledOnce();
    source.cleanup();
  });

  it("runs setup and teardown around the subscription", () => {
    const value = createContextValue("field");
    const source = createSource(value);
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: source.key, setup }, source.host);

    part.hostWillLoad();
    expect(setup).toHaveBeenCalledWith(value);
    part.hostDisconnected();
    expect(teardown).toHaveBeenCalledOnce();
    source.cleanup();
  });

  it("retries after render when no context was available", () => {
    const source = createSource();
    const value = createContextValue("late");
    const part = createPart({ context: source.key }, source.host);

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    source.set(value);
    expect(part.context).toBe(value);
    part.hostDisconnected();
    source.cleanup();
  });

  it("stays subscribed when another provider announces the same context", () => {
    const { provider, consumer } = createTree();
    const key = createContext<TestContext>(Symbol("late-provider"));
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: key, update }, consumer);

    // Request before a provider exists, so it stays pending.
    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    const first = createContextValue("first");
    provideContext(provider, key, first);
    expect(part.context).toBe(first);
    expect(update).toHaveBeenCalledOnce();

    // A second provider must not re-deliver the settled request.
    const other = createTree();
    provideContext(other.provider, key, createContextValue("other"));
    expect(update).toHaveBeenCalledOnce();

    notifyContext(provider, key);
    expect(update).toHaveBeenCalledTimes(2);

    part.hostDisconnected();
    cleanup(provider, other.provider);
  });

  it("reattaches and re-renders after a reconnect with a new provider", () => {
    const source = createSource(createContextValue("first"));
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, update }, source.host);

    part.hostWillLoad();
    part.hostDisconnected();
    expect(part.context).toBeUndefined();

    const second = createContextValue("second");
    source.set(second);
    part.hostConnected();
    expect(part.context).toBe(second);
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("can skip the subscription for one-shot consumers", () => {
    const source = createSource(createContextValue("field"));
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, subscribe: false, update }, source.host);

    part.hostWillLoad();
    source.notify();
    expect(update).not.toHaveBeenCalled();
    part.hostDisconnected();
    source.cleanup();
  });
});

describe("ContextPartController selector subscriptions", () => {
  it("notifies only when the selected snapshot changes", () => {
    const value = createContextValue("original");
    const source = createSource(value);
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, select: () => value.name, update }, source.host);

    part.hostWillLoad();
    expect(update).not.toHaveBeenCalled();

    source.notify();
    expect(update).not.toHaveBeenCalled();

    value.name = "changed";
    source.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("uses a custom equality for selected snapshots", () => {
    const value = createContextValue("original");
    const source = createSource(value);
    const update = vi.fn((): void => undefined);
    const equals = vi.fn(
      (previous: readonly [string, number], next: readonly [string, number]): boolean =>
        previous[0] === next[0],
    );
    let revision = 1;
    const part = createPart(
      { context: source.key, select: (): readonly [string, number] => [value.name, revision], equals, update },
      source.host,
    );

    part.hostWillLoad();
    revision = 2;
    source.notify();
    expect(update).not.toHaveBeenCalled();

    value.name = "changed";
    source.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("uses shallowEqual by default for flat array snapshots", () => {
    const value = createContextValue("original");
    const source = createSource(value);
    const update = vi.fn((): void => undefined);
    const part = createPart(
      { context: source.key, select: () => [value.name, true], update },
      source.host,
    );

    part.hostWillLoad();
    source.notify();
    expect(update).not.toHaveBeenCalled();

    value.name = "changed";
    source.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("skips selector work when subscriptions are disabled", () => {
    const value = createContextValue("field");
    const source = createSource(value);
    const select = vi.fn(() => [value.name]);
    const update = vi.fn((): void => undefined);
    const part = createPart(
      { context: source.key, select, subscribe: false, update },
      source.host,
    );

    part.hostWillLoad();
    source.notify();
    expect(select).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    part.hostDisconnected();
    source.cleanup();
  });

  it("applies selector filtering to custom update handlers", () => {
    const value = createContextValue("original");
    const source = createSource(value);
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, select: () => value.name, update }, source.host);

    part.hostWillLoad();
    source.notify();
    expect(update).not.toHaveBeenCalled();

    value.name = "changed";
    source.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("recaptures the snapshot after reattaching", () => {
    const first = createContextValue("first");
    const source = createSource(first);
    const update = vi.fn((): void => undefined);
    let current = first;
    const part = createPart(
      { context: source.key, select: () => current.name, update },
      source.host,
    );

    part.hostWillLoad();
    part.hostDisconnected();

    const second = createContextValue("second");
    current = second;
    source.set(second);
    part.hostConnected();
    expect(update).toHaveBeenCalledOnce();

    source.notify();
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });
});

describe("ContextPartController provider notifications", () => {
  it("attaches when a provider appears after the first render", () => {
    const source = createSource();
    const value = createContextValue("field");
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, update }, source.host);

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    source.set(value);
    expect(part.context).toBe(value);
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("stops listening after disconnect", () => {
    const value = createContextValue("field");
    const source = createSource(value);
    const part = createPart({ context: source.key }, source.host);

    part.hostWillLoad();
    part.hostDisconnected();
    source.set(createContextValue("replacement"));
    expect(part.context).toBeUndefined();
    source.cleanup();
  });

  it("updates one-shot consumers when their provider appears", () => {
    const source = createSource();
    const value = createContextValue("field");
    const update = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, subscribe: false, update }, source.host);

    part.hostWillLoad();
    source.set(value);
    expect(part.context).toBe(value);
    expect(update).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("replaces the context and tears down the previous one", () => {
    const first = createContextValue("first");
    const source = createSource(first);
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: source.key, setup }, source.host);

    part.hostWillLoad();

    const second = createContextValue("second");
    source.set(second);
    expect(part.context).toBe(second);
    expect(teardown).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenLastCalledWith(second);
    part.hostDisconnected();
    source.cleanup();
  });

  it("detaches when the provider disappears", () => {
    const value = createContextValue("field");
    const source = createSource(value);
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = createPart({ context: source.key, setup }, source.host);

    part.hostWillLoad();
    source.set(undefined);
    expect(part.context).toBeUndefined();
    expect(teardown).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });

  it("forwards notifications to a provider that needs to re-broadcast", () => {
    const value = createContextValue("root");
    const source = createSource(value);
    const onNotify = vi.fn((): void => undefined);
    const part = createPart({ context: source.key, onNotify }, source.host);

    part.hostWillLoad();
    source.notify();
    expect(onNotify).toHaveBeenCalledOnce();
    part.hostDisconnected();
    source.cleanup();
  });
});
