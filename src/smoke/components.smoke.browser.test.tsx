import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectAriaElements } from "../test-utils/aria";
import { queryControl, queryHost, queryPartIn } from "../test-utils/component";

describe("cross-browser smoke", () => {
  it("renders a component in a shadow root", async () => {
    const { root } = await render(<qui-button variant="filled">Save</qui-button>);
    const button = queryControl<HTMLButtonElement>(root, "button");

    expect(root.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(root.textContent).toBe("Save");
    expect(button).toHaveAttribute("part", "button");
  });

  it("keeps host layout separate from the visual root", async () => {
    const { root } = await render(
      <qui-card variant="filled">
        <span>Content</span>
      </qui-card>,
    );
    const visualRoot = queryPartIn(root, "root");

    expect(getComputedStyle(root).display).toBe("block");
    expect(visualRoot).toHaveAttribute("part", "root");
    expect(getComputedStyle(visualRoot).display).toBe("flex");
  });

  it("wires a field label and control across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="email" required>
        <qui-field-label>Email</qui-field-label>
        <qui-input inputType="email" />
      </qui-field>,
    );

    await waitForChanges();

    const labelHost = queryHost(root, "qui-field-label");
    const label = queryPartIn<HTMLLabelElement>(labelHost, "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");

    expect(label.htmlFor).toBe(input.id);
    expect(label).toHaveAttribute("data-required");
    expect(input.type).toBe("email");
    expectAriaElements(input, { ariaLabelledByElements: [labelHost] });
  });

  it("names a dialog across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      <qui-dialog open>
        <qui-dialog-content>
          <qui-dialog-title>Delete item?</qui-dialog-title>
          <qui-dialog-description>This cannot be undone.</qui-dialog-description>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();

    const dialog = queryPartIn<HTMLDialogElement>(queryHost(root, "qui-dialog-content"), "dialog");
    const titleHost = queryHost(root, "qui-dialog-title");
    const descriptionHost = queryHost(root, "qui-dialog-description");

    expectAriaElements(dialog, {
      ariaLabelledByElements: [titleHost],
      ariaDescribedByElements: [descriptionHost],
    });
  });
});
