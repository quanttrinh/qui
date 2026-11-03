import { createElement, render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

const tag = "qui-test-checkedchange";

if (!customElements.get(tag)) {
  customElements.define(tag, class extends HTMLElement {});
}

let root: HTMLDivElement | undefined;

afterEach(() => {
  if (root !== undefined) {
    render(null, root);
    root.remove();
    root = undefined;
  }
});

describe("Preact custom element events", () => {
  it("listens for the exact checkedchange event name", () => {
    const handler = vi.fn();
    root = document.createElement("div");
    document.body.append(root);
    render(createElement(tag, { oncheckedchange: handler }), root);

    const element = root.querySelector(tag);
    if (element === null) {
      throw new Error("test element was not rendered");
    }

    element.dispatchEvent(new CustomEvent("checkedchange", { detail: { checked: true } }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
