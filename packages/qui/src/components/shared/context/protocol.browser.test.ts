import { describe, expect, it, vi } from "vitest";

import { createTestControllerHost } from "../../../../tests/test-utils/controller-host";
import { ContextPartController } from "../controllers";
import { consumeOnce, createContext, provideContext } from "./index";

interface TestValue {
  label: string;
}

function tree(): { provider: HTMLElement; consumer: HTMLElement } {
  const provider = document.createElement("div");
  const consumer = document.createElement("div");
  provider.appendChild(consumer);
  document.body.appendChild(provider);
  return { provider, consumer };
}

describe("context protocol interoperability", () => {
  it("lets a protocol-only provider serve a qui part", () => {
    const { provider, consumer } = tree();
    const key = createContext<TestValue>(Symbol("external-provider"));
    const value = { label: "from outside" };

    // A plain DOM listener, using only the protocol event fields.
    provider.addEventListener("context-request", (event): void => {
      if (event.context !== key) {
        return;
      }
      event.stopImmediatePropagation();
      event.callback(value);
    });

    const part = new ContextPartController(createTestControllerHost(consumer), { context: key });
    part.hostWillLoad();
    expect(part.context).toBe(value);
    part.hostDisconnected();
    provider.remove();
  });

  it("lets a protocol-only consumer read a qui provider synchronously", () => {
    const { provider, consumer } = tree();
    const key = createContext<TestValue>(Symbol("external-consumer"));
    const value = { label: "from qui" };
    provideContext(provider, key, value);

    const callback = vi.fn();
    const event = Object.assign(
      new CustomEvent("context-request", { bubbles: true, composed: true }),
      { context: key, callback, subscribe: false, contextTarget: consumer },
    );
    consumer.dispatchEvent(event);

    expect(callback).toHaveBeenCalledWith(value);
    provider.remove();
  });

  it("propagates requests through shadow roots with composed events", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const consumer = document.createElement("div");
    shadow.appendChild(consumer);
    const key = createContext<TestValue>(Symbol("shadow-protocol"));
    const value = { label: "across shadow" };
    provideContext(host, key, value);

    expect(consumeOnce(consumer, key)).toBe(value);
    host.remove();
  });
});
