import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../../tests/test-utils/component";
import { waitForShadowStyles } from "../../../tests/test-utils/dom-ready";
import { expectFocusedDeep } from "../../../tests/test-utils/interactions";

function queryRequiredIndicator(root: HTMLElement): HTMLElement {
  return queryPartIn(
    resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox"),
    "required-indicator",
  );
}

describe("qui-checkbox", () => {
  it("toggles, updates its state, and emits checkedchange", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-checkbox value="yes">Check me</qui-checkbox>,
    );
    const spy = spyOnEvent("checkedchange");
    const host = resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox");
    const input = queryControl<HTMLInputElement>(host, "input");

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(queryPartIn(host, "root")).toHaveAttribute("data-state", "checked");
    expect(input.checked).toBe(true);
  });

  it("returns the live checked state for uncontrolled edits", async () => {
    const { root, waitForChanges } = await render(
      <qui-checkbox value="yes">Check me</qui-checkbox>,
    );
    const host = resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox");
    const input = queryControl<HTMLInputElement>(host, "input");

    await expect(host.getChecked()).resolves.toBe(false);

    input.click();
    await waitForChanges();

    await expect(host.getChecked()).resolves.toBe(true);
  });

  it("renders a required indicator and exposes aria-required", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox required>Check me</qui-checkbox>);

    await waitForChanges();

    const indicator = queryRequiredIndicator(root);
    const input = queryControl<HTMLInputElement>(
      resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox"),
      "input",
    );

    expect(indicator).toHaveAttribute("data-required");
    expect(indicator).toHaveTextContent("*");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("inherits required state from a wrapping qui-field", async () => {
    const { root, waitForChanges } = await render(
      <qui-field required>
        <qui-checkbox>Check me</qui-checkbox>
      </qui-field>,
    );

    await waitForChanges();

    const indicator = queryRequiredIndicator(root);

    expect(indicator).toHaveAttribute("data-required");
    expect(
      queryControl<HTMLInputElement>(
        resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox"),
        "input",
      ),
    ).toHaveAttribute("aria-required", "true");
  });

  it("updates the indicator when required changes", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox required>Check me</qui-checkbox>);
    await waitForChanges();
    expect(queryRequiredIndicator(root)).toHaveAttribute("data-required");

    (root as HTMLElement & { required: boolean }).required = false;
    await waitForChanges();

    expect(queryRequiredIndicator(root)).not.toHaveAttribute("data-required");
    expect(
      queryControl<HTMLInputElement>(
        resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox"),
        "input",
      ),
    ).not.toHaveAttribute("aria-required");
  });

  it("hides the indicator for optional checkboxes", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox>Check me</qui-checkbox>);

    await waitForChanges();
    await waitForShadowStyles(resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox"));

    const indicator = queryRequiredIndicator(root);

    expect(indicator).not.toHaveAttribute("data-required");
    expect(indicator).toHaveTextContent("*");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(getComputedStyle(indicator).display).toBe("none");
  });

  it("renders the indeterminate state and clears it on click", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-checkbox indeterminate>Check me</qui-checkbox>,
    );
    const spy = spyOnEvent("checkedchange");
    const host = resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(queryPartIn(host, "root")).toHaveAttribute("data-state", "indeterminate");
    expect(input.indeterminate).toBe(true);

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(queryPartIn(host, "root")).toHaveAttribute("data-state", "indeterminate");
  });

  it("focuses the internal native input", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox>Check me</qui-checkbox>);
    const host = resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox");
    const input = queryControl<HTMLInputElement>(host, "input");

    await host.focusControl();
    await waitForChanges();

    expectFocusedDeep(input);
  });
});

describe("qui-checkbox colors", () => {
  it("applies checked, outline, and label color custom properties", async () => {
    const { root } = await render(<qui-checkbox checked>Accept</qui-checkbox>);
    const host = resolveHost<HTMLQuiCheckboxElement>(root, "qui-checkbox");
    const control = queryPartIn(host, "control");
    const label = queryPartIn(host, "label");
    control.style.transition = "none";

    host.style.setProperty("--qui-checkbox-checked-color", "rgb(1, 2, 3)");
    host.style.setProperty("--qui-checkbox-checked-text-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-checkbox-label-color", "rgb(7, 8, 9)");
    host.style.setProperty("--qui-checkbox-outline-color", "rgb(10, 11, 12)");

    expect(getComputedStyle(control).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(control).borderTopColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(control).color).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(label).color).toBe("rgb(7, 8, 9)");
  });
});
