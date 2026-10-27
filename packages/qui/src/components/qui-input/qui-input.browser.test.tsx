import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, resolveHost } from "../../test-utils/component";
import { expectFocusedDeep, typeInto } from "../../test-utils/interactions";

function queryVisibilityTrigger(host: Element): HTMLButtonElement {
  return queryControl<HTMLButtonElement>(host, "[data-part=visibility-trigger]");
}

describe("qui-input", () => {
  it("applies a mask and emits both masked and unmasked values", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-input maskPattern="###-###" />);
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "123456");
    await waitForChanges();

    expect(input.value).toBe("123-456");
    expect(spy).toHaveReceivedEventDetail({ value: "123-456", unmaskedValue: "123456" });
  });

  it("steps number inputs and respects min/max", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={2} min={1} max={3} step={1} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

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
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const trigger = queryVisibilityTrigger(host);

    expect(input.type).toBe("password");
    const svg = trigger.querySelector("svg");
    const hiddenPath = svg?.querySelector("path")?.getAttribute("d");
    expect(svg?.getAttribute("viewBox")).toBe("0 -960 960 960");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");

    trigger.click();
    await waitForChanges();
    expect(input.type).toBe("text");
    const visiblePath = svg?.querySelector("path")?.getAttribute("d");
    expect(visiblePath).not.toBe(hiddenPath);

    trigger.click();
    await waitForChanges();
    expect(input.type).toBe("password");
    expect(svg?.querySelector("path")?.getAttribute("d")).toBe(hiddenPath);
  });

  it("focuses the internal native input", async () => {
    const { root, waitForChanges } = await render(<qui-input />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await host.focusControl();
    await waitForChanges();

    expectFocusedDeep(input);
  });
});
