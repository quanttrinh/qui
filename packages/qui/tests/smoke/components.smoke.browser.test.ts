import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectLinked } from "../test-utils/aria";
import { queryControl, queryHost, queryPartIn } from "../test-utils/component";
import { waitForShadowStyles } from "../test-utils/dom-ready";

describe("cross-browser smoke", () => {
  it("renders a component in a shadow root", async () => {
    const { root } = await render(h("qui-button", { variant: "filled" }, "Save"));
    const button = queryControl<HTMLButtonElement>(root, "button");

    expect(root.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(root.textContent).toBe("Save");
    expect(button).toHaveAttribute("part", "button");
  });

  it("keeps host layout separate from the visual root", async () => {
    const { root, waitForChanges } = await render(
      h("qui-card", { variant: "filled" }, h("span", null, "Content")),
    );
    await waitForChanges();
    await waitForShadowStyles(root);
    const visualRoot = queryPartIn(root, "root");

    expect(getComputedStyle(root).display).toBe("block");
    expect(visualRoot).toHaveAttribute("part", "root");
    expect(getComputedStyle(visualRoot).display).toBe("flex");
  });

  it("wires a field label and control across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      h(
        "qui-field",
        { id: "email", required: true },
        h("qui-field-label", null, "Email"),
        h("qui-input", null),
      ),
    );

    await waitForChanges();

    const labelHost = queryHost(root, "qui-field-label");
    const label = queryPartIn<HTMLLabelElement>(labelHost, "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");

    expect(label.htmlFor).toBe(input.id);
    expect(label).toHaveAttribute("data-required");
    expect(input.type).toBe("text");
    expectLinked(input, labelHost, "labelledby");
  });

  it("names a dialog across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      h(
        "qui-dialog",
        { open: true },
        h(
          "qui-dialog-content",
          null,
          h("qui-dialog-title", null, "Delete item?"),
          h("qui-dialog-description", null, "This cannot be undone."),
        ),
      ),
    );

    await waitForChanges();

    const dialog = queryPartIn<HTMLDialogElement>(queryHost(root, "qui-dialog-content"), "dialog");
    const titleHost = queryHost(root, "qui-dialog-title");
    const descriptionHost = queryHost(root, "qui-dialog-description");

    expectLinked(dialog, titleHost, "labelledby");
    expectLinked(dialog, descriptionHost, "describedby");
  });

  it("links tabs across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      h(
        "qui-tabs",
        { defaultValue: "one" },
        h("qui-tab-list", null, h("qui-tab-trigger", { value: "one" }, "One")),
        h("qui-tab-panel", { value: "one" }, "One panel"),
      ),
    );

    await waitForChanges();

    const triggerHost = queryHost(root, "qui-tab-trigger");
    const trigger = queryPartIn<HTMLButtonElement>(triggerHost, "trigger");
    const panelHost = queryHost(root, "qui-tab-panel");
    const panel = queryPartIn<HTMLDivElement>(panelHost, "panel");

    expectLinked(trigger, panelHost, "controls");
    expectLinked(panel, triggerHost, "labelledby");
  });

  it("links accordion parts across shadow roots", async () => {
    const { root, waitForChanges } = await render(
      h(
        "qui-accordion",
        null,
        h(
          "qui-accordion-item",
          { value: "one" },
          h("qui-accordion-trigger", null, "One"),
          h("qui-accordion-content", null, "One content"),
        ),
      ),
    );

    await waitForChanges();

    const triggerHost = queryHost(root, "qui-accordion-trigger");
    const trigger = queryPartIn<HTMLButtonElement>(triggerHost, "trigger");
    const contentHost = queryHost(root, "qui-accordion-content");
    const content = queryPartIn<HTMLDivElement>(contentHost, "content");

    expectLinked(trigger, contentHost, "controls");
    expectLinked(content, triggerHost, "labelledby");
  });
});
