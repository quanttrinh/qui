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
