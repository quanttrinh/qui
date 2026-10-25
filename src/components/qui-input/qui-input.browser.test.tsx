import { describe, expect, h, it, render } from "@stencil/vitest";

function queryInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Expected a native input");
  }
  return input;
}

describe("qui-input", () => {
  it("applies a mask and emits both masked and unmasked values", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-input maskPattern="###-###" />);
    const spy = spyOnEvent("valuechange");
    const input = queryInput(root);

    input.value = "123456";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();

    expect(input.value).toBe("123-456");
    expect(spy).toHaveReceivedEventDetail({ value: "123-456", unmaskedValue: "123456" });
  });

  it("steps number inputs and respects min/max", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={2} min={1} max={3} step={1} />,
    );
    const input = queryInput(root);
    const increment = root.querySelector<HTMLButtonElement>("[data-part=increment-trigger]");
    const decrement = root.querySelector<HTMLButtonElement>("[data-part=decrement-trigger]");
    if (increment === null || decrement === null) {
      throw new TypeError("Expected number stepper buttons");
    }

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("3");
    expect(increment.disabled).toBe(true);

    decrement.click();
    await waitForChanges();
    expect(input.value).toBe("2");
  });

  it("toggles password visibility", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="password" value="secret" />,
    );
    const input = queryInput(root);
    const trigger = root.querySelector<HTMLButtonElement>("[data-part=visibility-trigger]");
    if (trigger === null) {
      throw new TypeError("Expected a visibility trigger");
    }

    expect(input.type).toBe("password");
    trigger.click();
    await waitForChanges();
    expect(input.type).toBe("text");
    trigger.click();
    await waitForChanges();
    expect(input.type).toBe("password");
  });
});
