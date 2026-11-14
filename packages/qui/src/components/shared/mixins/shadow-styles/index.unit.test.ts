import { describe, expect, it } from "vitest";

import { ShadowStylesMixin } from "./index";

interface MixedInstance {
  host: HTMLElement;
  connectedCallback: () => void;
}

function createHost(): HTMLElement {
  const dataset: Record<string, string> = {};
  return {
    shadowRoot: {},
    dataset,
    setAttribute: (name: string, value: string): void => {
      if (name === "data-qui-shadow-styles") {
        dataset.quiShadowStyles = value;
      }
    },
  } as unknown as HTMLElement;
}

function createMixed(): {
  instance: MixedInstance;
  calls: string[];
} {
  const calls: string[] = [];
  class Base {
    host = createHost();

    // oxlint-disable-next-line eslint/class-methods-use-this -- lifecycle hook recorded without instance state.
    connectedCallback(): void {
      calls.push("base");
    }
  }
  // oxlint-disable-next-line eslint/new-cap -- the mixin factory is applied directly in this test.
  const Mixed = ShadowStylesMixin(Base) as unknown as new () => MixedInstance;
  return { instance: new Mixed(), calls };
}

describe("ShadowStylesMixin", () => {
  it("links the shared stylesheet and forwards the previous lifecycle", () => {
    const { instance, calls } = createMixed();

    instance.connectedCallback();

    expect(calls).toEqual(["base"]);
    expect(instance.host.dataset.quiShadowStyles).toBe("");
  });
});
