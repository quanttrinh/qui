import { describe, expect, it, vi } from "vitest";

import type { ContextCallback } from "./index";

import {
  clearContext,
  consumeOnce,
  createContext,
  notifyContext,
  provideContext,
  requestContext,
} from "./index";
import {
  cleanup,
  createElement,
  createShadowTree,
  createTree,
} from "../../../../tests/test-utils/context-dom";

interface TestContext {
  name: string;
}

const makeContext = () => createContext<TestContext>();

describe("context-request protocol", () => {
  it("finds the nearest provider in the ancestor chain", () => {
    const outer = createElement();
    const inner = createElement();
    const consumer = createElement();
    inner.appendChild(consumer);
    outer.appendChild(inner);
    const outerValue = { name: "outer" };
    const innerValue = { name: "inner" };
    const key = makeContext();
    provideContext(outer, key, outerValue);
    provideContext(inner, key, innerValue);

    expect(consumeOnce(consumer, key)).toBe(innerValue);
    cleanup(outer);
  });

  it("crosses shadow-root boundaries through the host", () => {
    const { host, shadowHost } = createShadowTree();
    const key = makeContext();
    const value = { name: "from host" };
    provideContext(shadowHost, key, value);

    expect(consumeOnce(host, key)).toBe(value);
    cleanup(shadowHost);
  });

  it("returns undefined when no ancestor provides the context", () => {
    const { consumer, provider } = createTree();
    expect(consumeOnce(consumer, makeContext())).toBeUndefined();
    cleanup(provider);
  });

  it("returns undefined after the provider is cleared", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    provideContext(provider, key, { name: "before" });
    expect(consumeOnce(consumer, key)?.name).toBe("before");

    clearContext(provider, key);
    expect(consumeOnce(consumer, key)).toBeUndefined();
    cleanup(provider);
  });

  it("notifies subscribers when the provider publishes a new value", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const first = { name: "first" };
    const second = { name: "second" };
    const values: TestContext[] = [];
    const callback: ContextCallback<TestContext | undefined> = (value) => {
      if (value !== undefined) {
        values.push(value);
      }
    };
    provideContext(provider, key, first);
    requestContext(consumer, key, callback, true);
    provideContext(provider, key, second);

    expect(values).toEqual([first, second]);
    cleanup(provider);
  });

  it("pushes state updates through notifyContext", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "original" };
    const seen: string[] = [];
    provideContext(provider, key, value);
    requestContext(consumer, key, (next) => {
      if (next !== undefined) {
        seen.push(next.name);
      }
    }, true);
    value.name = "changed";
    notifyContext(provider, key);
    expect(seen).toEqual(["original", "changed"]);
    cleanup(provider);
  });

  it("stops notifications after unsubscribe", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "value" };
    let calls = 0;
    let unsubscribe: (() => void) | undefined;
    provideContext(provider, key, value);
    requestContext(consumer, key, (_next, stop) => {
      calls += 1;
      unsubscribe = stop;
    }, true);
    unsubscribe?.();
    notifyContext(provider, key);

    expect(calls).toBe(1);
    cleanup(provider);
  });

  it("answers requests issued before the provider existed", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "late provider" };
    const seen: TestContext[] = [];
    requestContext(consumer, key, (next) => {
      if (next !== undefined) {
        seen.push(next);
      }
    }, true);

    provideContext(provider, key, value);
    expect(seen).toEqual([value]);
    cleanup(provider);
  });

  it("does not retain a one-shot callback answered by a late provider", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "late one-shot" };
    const callback = vi.fn((): void => undefined);
    requestContext(consumer, key, callback, false);

    provideContext(provider, key, value);
    expect(callback).toHaveBeenCalledOnce();

    notifyContext(provider, key);
    expect(callback).toHaveBeenCalledOnce();
    cleanup(provider);
  });

  it("keeps the subscription when the same consumer requests again", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const first = { name: "first" };
    let unsubscribe: (() => void) | undefined;

    // Track the latest unsubscribe, like a part does.
    const callback = vi.fn(
      (_value: TestContext | undefined, nextUnsubscribe?: () => void): void => {
        if (nextUnsubscribe !== unsubscribe) {
          unsubscribe?.();
          unsubscribe = nextUnsubscribe;
        }
      },
    );

    provideContext(provider, key, first);
    requestContext(consumer, key, callback, true);
    expect(callback).toHaveBeenCalledOnce();

    // A duplicate request must reuse the subscription.
    requestContext(consumer, key, callback, true);
    expect(callback).toHaveBeenCalledTimes(2);

    notifyContext(provider, key);
    expect(callback).toHaveBeenCalledTimes(3);
    cleanup(provider);
  });

  it("does not re-deliver an answered request when another provider appears", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const callback = vi.fn((): void => undefined);

    // The first provider answers the pending request.
    requestContext(consumer, key, callback, true);
    provideContext(provider, key, { name: "first" });
    expect(callback).toHaveBeenCalledOnce();

    // It was settled, so another provider must not re-dispatch it.
    const other = createTree();
    provideContext(other.provider, key, { name: "other" });
    expect(callback).toHaveBeenCalledOnce();

    notifyContext(provider, key);
    expect(callback).toHaveBeenCalledTimes(2);
    cleanup(provider, other.provider);
  });

  it("falls back to a more distant provider when the nearest one is cleared", () => {
    const outer = createElement();
    const inner = createElement();
    const consumer = createElement();
    inner.appendChild(consumer);
    outer.appendChild(inner);
    const key = makeContext();
    const outerValue = { name: "outer" };
    const innerValue = { name: "inner" };
    const seen: (TestContext | undefined)[] = [];
    provideContext(outer, key, outerValue);
    provideContext(inner, key, innerValue);
    requestContext(consumer, key, (next): void => {
      seen.push(next);
    }, true);

    clearContext(inner, key);
    expect(seen.at(-1)).toBe(outerValue);
    cleanup(outer);
  });

  it("does not let a more distant provider answer after stopImmediatePropagation", () => {
    const outer = createElement();
    const inner = createElement();
    const consumer = createElement();
    inner.appendChild(consumer);
    outer.appendChild(inner);
    const key = makeContext();
    const outerValue = { name: "outer" };
    const innerValue = { name: "inner" };
    const seen: TestContext[] = [];
    provideContext(outer, key, outerValue);
    provideContext(inner, key, innerValue);

    requestContext(consumer, key, (next) => {
      if (next !== undefined) {
        seen.push(next);
      }
    }, true);
    expect(seen).toEqual([innerValue]);
    cleanup(outer);
  });

  it("keeps context families isolated", () => {
    const { provider, consumer } = createTree();
    const first = makeContext();
    const second = makeContext();
    const value = { name: "only first" };
    provideContext(provider, first, value);

    expect(consumeOnce(consumer, first)).toBe(value);
    expect(consumeOnce(consumer, second)).toBeUndefined();
    cleanup(provider);
  });

  it("ignores a provider in a sibling subtree", () => {
    const root = createElement();
    const provider = createElement();
    const consumer = createElement();
    root.append(provider, consumer);
    const key = makeContext();
    provideContext(provider, key, { name: "sibling" });

    expect(consumeOnce(consumer, key)).toBeUndefined();
    cleanup(root);
  });

  it("treats repeated unsubscribe as a no-op", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "value" };
    let calls = 0;
    let unsubscribe: (() => void) | undefined;
    provideContext(provider, key, value);
    requestContext(consumer, key, (_next, stop) => {
      calls += 1;
      unsubscribe = stop;
    }, true);
    unsubscribe?.();
    unsubscribe?.();

    expect(calls).toBe(1);
    cleanup(provider);
  });

  it("does not register a one-shot callback as a subscriber", () => {
    const { provider, consumer } = createTree();
    const key = makeContext();
    const value = { name: "once" };
    const callback = vi.fn();
    provideContext(provider, key, value);
    consumeOnce(consumer, key);
    notifyContext(provider, key);

    expect(callback).not.toHaveBeenCalled();
    cleanup(provider);
  });
});
