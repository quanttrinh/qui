import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { onContextProvided } from "./context-part";
import { createContextStore } from "./context-store";

const KEY = "tabs";

interface FakeShadowRoot {
  nodeType: number;
  host: FakeElement;
}

function ShadowRootStub(): void {}

class FakeElement {
  parentElement: FakeElement | undefined = undefined;
  shadowRoot: FakeShadowRoot | undefined = undefined;

  readonly getRootNode = (): object => this.shadowRoot ?? this;
}

const globals = globalThis as Record<string, unknown>;
const originalHTMLElement = globals.HTMLElement;
const originalShadowRoot = globals.ShadowRoot;

beforeAll(() => {
  globals.HTMLElement = FakeElement;
  globals.ShadowRoot = ShadowRootStub;
});

afterAll(() => {
  globals.HTMLElement = originalHTMLElement;
  globals.ShadowRoot = originalShadowRoot;
});

interface TestContext {
  name: string;
}

function asHost(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function childOf(parent: FakeElement): FakeElement {
  const child = new FakeElement();
  child.parentElement = parent;
  return child;
}

function shadowChildOf(host: FakeElement): FakeElement {
  const child = new FakeElement();
  const root = Object.create(ShadowRootStub.prototype as object) as FakeShadowRoot;
  root.nodeType = 11;
  root.host = host;
  child.shadowRoot = root;
  return child;
}

async function flush(): Promise<void> {
  await Promise.resolve();
}

describe("createContextStore", () => {
  it("finds context on a parent in the same tree", () => {
    const store = createContextStore<TestContext>(KEY);
    const provider = new FakeElement();
    const consumer = childOf(provider);
    const context = { name: "field" };

    store.provide(asHost(provider), context);

    expect(store.consume(asHost(consumer))).toBe(context);
  });

  it("finds the nearest provider higher in the ancestor chain", () => {
    const store = createContextStore<TestContext>(KEY);
    const provider = new FakeElement();
    const middle = childOf(provider);
    const consumer = childOf(middle);
    const context = { name: "ancestor" };

    store.provide(asHost(provider), context);

    expect(store.consume(asHost(consumer))).toBe(context);
  });

  it("crosses shadow-root boundaries through the host", () => {
    const store = createContextStore<TestContext>(KEY);
    const provider = new FakeElement();
    const consumer = shadowChildOf(provider);
    const context = { name: "shadow" };

    store.provide(asHost(provider), context);

    expect(store.consume(asHost(consumer))).toBe(context);
  });

  it("returns undefined when no ancestor provides context", () => {
    const store = createContextStore<TestContext>(KEY);
    const consumer = new FakeElement();

    expect(store.consume(asHost(consumer))).toBeUndefined();
  });

  it("returns undefined after the context is cleared", () => {
    const store = createContextStore<TestContext>(KEY);
    const provider = new FakeElement();
    const consumer = childOf(provider);

    store.provide(asHost(provider), { name: "cleared" });
    store.clear(asHost(provider));

    expect(store.consume(asHost(consumer))).toBeUndefined();
  });

  it("notifies consumers when a context is provided and cleared", async () => {
    const store = createContextStore<TestContext>(KEY);
    const provider = new FakeElement();
    const listener = vi.fn((): void => undefined);
    const unsubscribe = onContextProvided(KEY, listener);

    store.provide(asHost(provider), { name: "notify" });
    await flush();
    expect(listener).toHaveBeenCalledOnce();

    store.clear(asHost(provider));
    await flush();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });
});
