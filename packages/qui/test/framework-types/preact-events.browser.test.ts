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

// This documents Preact's runtime behavior, not the generator itself: custom
// element events preserve the casing after `on`, so the capitalized handler
// must not receive a lowercase `checkedchange` event.
describe("Preact custom element events", () => {
  it("only fires the handler with the exact event name", () => {
    const exact = vi.fn();
    const capitalized = vi.fn();
    root = document.createElement("div");
    document.body.append(root);
    render(
      createElement(
        "div",
        null,
        createElement(tag, { oncheckedchange: exact }),
        createElement(tag, { onCheckedchange: capitalized }),
      ),
      root,
    );

    const elements = root.querySelectorAll(tag);
    expect(elements).toHaveLength(2);

    for (const element of elements) {
      element.dispatchEvent(new CustomEvent("checkedchange", { detail: { checked: true } }));
    }

    expect(exact).toHaveBeenCalledTimes(1);
    expect(capitalized).not.toHaveBeenCalled();
  });
});
