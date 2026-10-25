import { describe, expect, h, it, render } from "@stencil/vitest";

function queryInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Expected a native input");
  }
  return input;
}

describe("qui-checkbox", () => {
  it("toggles, updates its state, and emits checkedchange", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-checkbox value="yes">Check me</qui-checkbox>,
    );
    const spy = spyOnEvent("checkedchange");
    const input = queryInput(root);

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(root.querySelector("[part=root]")).toHaveAttribute("data-state", "checked");
    expect(input.checked).toBe(true);
  });

  it("renders a required indicator and exposes aria-required", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox required>Check me</qui-checkbox>);

    await waitForChanges();

    const indicator = root.querySelector("[part=required-indicator]");
    const input = queryInput(root);

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

    const indicator = root.querySelector("[part=required-indicator]");

    expect(indicator).toHaveAttribute("data-required");
    expect(queryInput(root)).toHaveAttribute("aria-required", "true");
  });

  it("updates the indicator when required changes", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox required>Check me</qui-checkbox>);
    await waitForChanges();
    expect(root.querySelector("[part=required-indicator]")).toHaveAttribute("data-required");

    (root as HTMLElement & { required: boolean }).required = false;
    await waitForChanges();

    expect(root.querySelector("[part=required-indicator]")).not.toHaveAttribute("data-required");
    expect(queryInput(root)).not.toHaveAttribute("aria-required");
  });

  it("hides the indicator for optional checkboxes", async () => {
    const { root, waitForChanges } = await render(<qui-checkbox>Check me</qui-checkbox>);

    await waitForChanges();

    const indicator = root.querySelector<HTMLElement>("[part=required-indicator]");

    expect(indicator).not.toHaveAttribute("data-required");
    expect(indicator).toHaveTextContent("*");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator === null ? "" : getComputedStyle(indicator).display).toBe("none");
  });

  it("renders the indeterminate state and clears it on click", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-checkbox indeterminate>Check me</qui-checkbox>,
    );
    const spy = spyOnEvent("checkedchange");
    const input = queryInput(root);

    expect(root.querySelector("[part=root]")).toHaveAttribute("data-state", "indeterminate");
    expect(input.indeterminate).toBe(true);

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(root.querySelector("[part=root]")).toHaveAttribute("data-state", "indeterminate");
  });
});
