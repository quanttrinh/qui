import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectAriaElements } from "../../test-utils/aria";
import { queryHost, queryPartIn } from "../../test-utils/component";
import { waitForShadowStyles } from "../../test-utils/dom-ready";
import { expectFocusedDeep } from "../../test-utils/interactions";
import { isDeepActiveElement, shadowOf } from "../../test-utils/shadow";

function queryParts(root: HTMLElement): {
  labelHost: HTMLElement;
  helperHost: HTMLElement;
  errorHost: HTMLElement;
  label: HTMLLabelElement;
  input: HTMLInputElement;
} {
  const labelHost = queryHost(root, "qui-field-label");
  return {
    labelHost,
    helperHost: queryHost(root, "qui-field-helper-text"),
    errorHost: queryHost(root, "qui-field-error-text"),
    label: queryPartIn<HTMLLabelElement>(labelHost, "label"),
    input: queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input"),
  };
}

// oxlint-disable-next-line eslint/max-lines-per-function -- Integration-style browser coverage.
describe("qui-field", () => {
  it("wires ids and ARIA across label, helper text, and error text", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="email" required invalid>
        <qui-field-label>Email</qui-field-label>
        <qui-input />
        <qui-field-helper-text>Helper</qui-field-helper-text>
        <qui-field-error-text>Error</qui-field-error-text>
      </qui-field>,
    );

    await waitForChanges();

    const { labelHost, helperHost, errorHost, label, input } = queryParts(root);

    expect(shadowOf(labelHost)).toBeInstanceOf(ShadowRoot);
    expect(shadowOf(helperHost)).toBeInstanceOf(ShadowRoot);
    expect(shadowOf(errorHost)).toBeInstanceOf(ShadowRoot);

    expect(label).toHaveAttribute("data-required");
    expect(root).toHaveAttribute("data-invalid");
    expect(labelHost.id).toBe("email::label");
    expect(label.hasAttribute("id")).toBe(false);
    expect(label.htmlFor).toBe("email::control");
    expect(input.id).toBe("email::control");
    expectAriaElements(input, {
      ariaLabelledByElements: [labelHost],
      ariaDescribedByElements: [helperHost],
      ariaErrorMessageElements: [errorHost],
    });
    expect(helperHost.id).toBe("email::helper-text");
    expect(errorHost.id).toBe("email::error-text");
  });

  it("keeps host layout minimal and styles the inner root", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="email" disabled>
        <qui-field-label>Email</qui-field-label>
        <qui-input />
      </qui-field>,
    );
    await waitForChanges();
    await waitForShadowStyles(root);
    const visualRoot = queryPartIn(root, "root");

    expect(getComputedStyle(root).display).toBe("block");
    expect(visualRoot).toHaveAttribute("data-disabled");
    expect(getComputedStyle(visualRoot).display).toBe("flex");
    expect(getComputedStyle(visualRoot).flexDirection).toBe("column");
    expect(getComputedStyle(visualRoot).cursor).toBe("not-allowed");
  });

  it("activates a checkbox when the label is clicked", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="terms">
        <qui-field-label>Accept terms</qui-field-label>
        <qui-checkbox />
      </qui-field>,
    );

    await waitForChanges();

    const label = queryPartIn<HTMLLabelElement>(queryHost(root, "qui-field-label"), "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-checkbox"), "input");

    expect(input.checked).toBe(false);
    label.click();
    await waitForChanges();
    expect(input.checked).toBe(true);
  });

  it("activates a switch when the label is clicked", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="updates">
        <qui-field-label>Updates</qui-field-label>
        <qui-switch />
      </qui-field>,
    );

    await waitForChanges();

    const label = queryPartIn<HTMLLabelElement>(queryHost(root, "qui-field-label"), "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-switch"), "input");

    expect(input.checked).toBe(false);
    label.click();
    await waitForChanges();
    expect(input.checked).toBe(true);
  });

  it("does not open select or combobox from a label click", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="choice">
        <qui-field-label>Choice</qui-field-label>
        <qui-select>
          <qui-option value="a">A</qui-option>
        </qui-select>
        <qui-combobox openOnClick>
          <qui-option value="b">B</qui-option>
        </qui-combobox>
      </qui-field>,
    );

    await waitForChanges();
    const label = queryPartIn<HTMLLabelElement>(queryHost(root, "qui-field-label"), "label");
    const selectTrigger = queryPartIn<HTMLButtonElement>(queryHost(root, "qui-select"), "trigger");
    const comboTrigger = queryPartIn<HTMLButtonElement>(queryHost(root, "qui-combobox"), "trigger");

    label.click();
    await waitForChanges();

    expect(selectTrigger).toHaveAttribute("aria-expanded", "false");
    expect(comboTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("focuses the internal control when the label is clicked", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="email">
        <qui-field-label>Email</qui-field-label>
        <qui-input />
      </qui-field>,
    );

    await waitForChanges();

    const labelHost = queryHost(root, "qui-field-label");
    const label = queryPartIn<HTMLLabelElement>(labelHost, "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");

    input.blur();
    label.click();

    expectFocusedDeep(input);
  });

  it("does not activate or focus a disabled control from its label", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="disabled" disabled>
        <qui-field-label>Disabled</qui-field-label>
        <qui-checkbox />
      </qui-field>,
    );

    await waitForChanges();

    const label = queryPartIn<HTMLLabelElement>(queryHost(root, "qui-field-label"), "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-checkbox"), "input");
    input.blur();
    label.click();
    await waitForChanges();

    expect(input.checked).toBe(false);
    expect(isDeepActiveElement(input)).toBe(false);
  });

  it("focuses a read-only control from its label", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="readonly" readOnly>
        <qui-field-label>Read only</qui-field-label>
        <qui-input />
      </qui-field>,
    );

    await waitForChanges();

    const label = queryPartIn<HTMLLabelElement>(queryHost(root, "qui-field-label"), "label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");
    input.blur();
    label.click();

    expectFocusedDeep(input);
  });

  it("does not focus the control when an interactive label descendant is clicked", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="interactive-label">
        <qui-field-label>
          Email
          <button type="button">Help</button>
        </qui-field-label>
        <qui-input />
      </qui-field>,
    );

    await waitForChanges();

    const labelHost = queryHost(root, "qui-field-label");
    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");
    const button = queryHost<HTMLButtonElement>(labelHost, "button");
    input.blur();
    button.click();

    expect(isDeepActiveElement(input)).toBe(false);
  });

  it("does not let host part attributes break context lifecycles", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="field" required>
        <qui-field-label>
          Label
          <qui-field-required-indicator />
        </qui-field-label>
        <qui-input />
        <qui-field-helper-text>Helper</qui-field-helper-text>
        <qui-field-error-text>Error</qui-field-error-text>
      </qui-field>,
    );

    await waitForChanges();

    const helperHost = queryHost(root, "qui-field-helper-text");
    const errorHost = queryHost(root, "qui-field-error-text");
    const indicatorHost = queryHost(root, "qui-field-required-indicator");

    expect(helperHost.id).toBe("field::helper-text");
    expect(errorHost.id).toBe("field::error-text");
    expect(indicatorHost).toHaveAttribute("data-required");
    expect(indicatorHost).toHaveAttribute("part", "required-indicator");
    expect(shadowOf(indicatorHost)).toBeInstanceOf(ShadowRoot);
  });

  it("propagates disabled and read-only state to its control", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="field" disabled readOnly>
        <qui-field-label>Label</qui-field-label>
        <qui-input />
      </qui-field>,
    );

    await waitForChanges();

    const input = queryPartIn<HTMLInputElement>(queryHost(root, "qui-input"), "input");

    expect(root).toHaveAttribute("data-disabled");
    expect(root).toHaveAttribute("data-readonly");
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });
});
