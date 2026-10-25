import { describe, expect, h, it, render } from "@stencil/vitest";

function queryInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Expected a native input");
  }
  return input;
}

describe("qui-switch", () => {
  it("toggles and emits a boolean", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-switch value="on">Enable</qui-switch>,
    );
    const spy = spyOnEvent("checkedchange");
    const input = queryInput(root);

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(root.querySelector("[part=root]")).toHaveAttribute("data-state", "checked");
    expect(input.checked).toBe(true);
  });

  it("does not toggle when read-only", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-switch readOnly>Enable</qui-switch>,
    );
    const spy = spyOnEvent("checkedchange");
    const input = queryInput(root);

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventTimes(0);
    expect(root.querySelector("[part=root]")).toHaveAttribute("data-state", "unchecked");

    await setProps({ readOnly: false });
    input.click();
    await waitForChanges();
    expect(spy).toHaveReceivedEventTimes(1);
  });
});
