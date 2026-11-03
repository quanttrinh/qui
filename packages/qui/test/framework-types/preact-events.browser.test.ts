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

// Preact 10 preserves the casing after `on` for unknown events, so the
// generated prop must be `oncheckedchange`. Preact 11 lowercases the suffix
// when it starts uppercase, so `onCheckedchange` also happens to work there.
// The lowercase form is the portable contract.
describe("Preact custom element events", () => {
  it("fires the handler with the generated event name", () => {
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
