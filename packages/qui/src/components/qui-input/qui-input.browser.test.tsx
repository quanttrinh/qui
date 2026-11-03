import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, resolveHost } from "../../test-utils/component";
import { expectFocusedDeep, typeInto } from "../../test-utils/interactions";

function queryVisibilityTrigger(host: Element): HTMLButtonElement {
  return queryControl<HTMLButtonElement>(host, "[data-part=visibility-trigger]");
}

// oxlint-disable-next-line max-lines-per-function -- the suite is grouped by component.
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

  it("strips non-numeric characters when input mode is numeric", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-input inputModeHint="numeric" maskPattern="###-###" />,
    );
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "12a3-4b5");
    await waitForChanges();

    expect(input.value).toBe("123-45");
    expect(spy).toHaveReceivedEventDetail({ value: "123-45", unmaskedValue: "12345" });
  });

  it("sanitizes controlled values in numeric mode", async () => {
    const { root } = await render(<qui-input inputModeHint="numeric" value="a1b2" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("12");
    expect(host.value).toBe("12");
  });

  it("strips signs and decimal separators in numeric mode", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="numeric" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-1.5,2");
    await waitForChanges();

    expect(input.value).toBe("152");
  });

  it("allows one sign and one decimal separator in decimal mode", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="decimal" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-1.2.3,4");
    await waitForChanges();
    expect(input.value).toBe("-1.234");

    typeInto(input, "1,25");
    await waitForChanges();
    expect(input.value).toBe("1,25");
  });

  it("accepts negative decimals in native number inputs", async () => {
    const { root } = await render(<qui-input inputType="number" step="any" value={-1.5} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("-1.5");
    expect(input.validity.valid).toBe(true);
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

  it("forwards number constraints to the native input", async () => {
    const { root } = await render(
      <qui-input inputType="number" value={5} min={1} max={3} step={1} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.min).toBe("1");
    expect(input.max).toBe("3");
    expect(input.step).toBe("1");
    expect(input.validity.rangeOverflow).toBe(true);
  });

  it("does not forward number constraints to non-number inputs", async () => {
    const { root } = await render(<qui-input min={1} max={3} step={1} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.hasAttribute("min")).toBe(false);
    expect(input.hasAttribute("max")).toBe(false);
    expect(input.hasAttribute("step")).toBe(false);
  });

  it("supports step any for number inputs", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" step="any" value={1.5} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    expect(input.step).toBe("any");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2.5");
  });

  it("reads a numeric step from an attribute", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" value={0} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    host.setAttribute("step", "2");
    await waitForChanges();
    expect(input.step).toBe("2");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2");
  });

  it("forwards multiple for email inputs", async () => {
    const { root } = await render(<qui-input inputType="email" multiple />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.multiple).toBe(true);
  });

  it("does not forward multiple to non-email inputs", async () => {
    const { root } = await render(<qui-input multiple />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.multiple).toBe(false);
  });

  it("renders url inputs with keyboard hints", async () => {
    const { root } = await render(<qui-input inputType="url" enterKeyAction="go" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.type).toBe("url");
    expect(input.enterKeyHint).toBe("go");
  });

  it("forwards spellcheck and autocorrect hints to supported inputs", async () => {
    const { root } = await render(<qui-input spellcheckHint={false} autocorrectHint={false} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.spellcheck).toBe(false);
    expect(input.getAttribute("autocorrect")).toBe("off");
  });

  it("maps autocorrect true to the native on value", async () => {
    const { root } = await render(<qui-input autocorrectHint />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.getAttribute("autocorrect")).toBe("on");
  });

  it("forwards autocorrect but not spellcheck to email", async () => {
    const { root } = await render(
      <qui-input inputType="email" spellcheckHint={false} autocorrectHint={false} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.hasAttribute("spellcheck")).toBe(false);
    expect(input.getAttribute("autocorrect")).toBe("off");
  });

  it("does not forward spellcheck and autocorrect to unsupported inputs", async () => {
    const { root } = await render(
      <qui-input inputType="password" spellcheckHint={false} autocorrectHint={false} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.hasAttribute("spellcheck")).toBe(false);
    expect(input.hasAttribute("autocorrect")).toBe(false);
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
