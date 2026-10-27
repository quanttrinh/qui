import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../test-utils/component";
import { waitForShadowStyles } from "../../test-utils/dom-ready";
import { expectFocusedDeep } from "../../test-utils/interactions";

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
