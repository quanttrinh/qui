import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, resolveHost } from "../../test-utils/component";
import { typeInto } from "../../test-utils/interactions";

describe("qui-input numeric", () => {
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
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-input inputModeHint="numeric" value="a1b2" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const spy = spyOnEvent("valuechange");

    await setProps({ value: "c3d4" });
    await waitForChanges();

    expect(input.value).toBe("34");
    expect(host.value).toBe("34");
    expect(spy).toHaveReceivedEventDetail({ value: "34", unmaskedValue: "34" });
  });

  it("does not sanitize email inputs in numeric mode", async () => {
    const { root } = await render(
      <qui-input inputType="email" inputModeHint="numeric" value="a1b2" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("a1b2");
    expect(host.value).toBe("a1b2");
  });

  it("re-sanitizes when the input mode changes", async () => {
    const { root, waitForChanges } = await render(<qui-input value="a1b2" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    host.inputModeHint = "numeric";
    await waitForChanges();

    expect(input.value).toBe("12");
    expect(host.value).toBe("12");
  });

  it("re-sanitizes when the input type changes", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" inputModeHint="numeric" value="12.5" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    host.inputType = "text";
    await waitForChanges();

    expect(input.value).toBe("125");
    expect(host.value).toBe("125");
  });

  it("keeps a leading minus and strips separators in numeric mode", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="numeric" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-1.5,2");
    await waitForChanges();
    expect(input.value).toBe("-152");

    typeInto(input, "1-2");
    await waitForChanges();
    expect(input.value).toBe("12");
  });

  it("strips the minus when min is non-negative", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="numeric" min={0} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-12");
    await waitForChanges();
    expect(input.value).toBe("12");
  });

  it("keeps the minus when min is negative", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="numeric" min={-10} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-12");
    await waitForChanges();
    expect(input.value).toBe("-12");
  });

  it("only removes disallowed decimal characters", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="decimal" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "-1.2.3,4x");
    await waitForChanges();
    expect(input.value).toBe("-1.2.3,4");

    typeInto(input, "1,25");
    await waitForChanges();
    expect(input.value).toBe("1,25");
  });

  it("keeps grouped decimal pastes unchanged", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="decimal" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "1,234.56");
    await waitForChanges();
    expect(input.value).toBe("1,234.56");

    typeInto(input, "1.234,56");
    await waitForChanges();
    expect(input.value).toBe("1.234,56");

    typeInto(input, "1,234,567");
    await waitForChanges();
    expect(input.value).toBe("1,234,567");

    typeInto(input, "1.2.3");
    await waitForChanges();
    expect(input.value).toBe("1.2.3");
  });

  it("accepts negative decimals in native number inputs", async () => {
    const { root } = await render(
      <qui-input inputType="number" inputModeHint="decimal" step="any" value={-1.5} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("-1.5");
    expect(input.validity.valid).toBe(true);
  });

  it("filters invalid text from number inputs", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-input inputType="number" value={3} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await setProps({ value: "3ssss" });
    await waitForChanges();

    expect(input.value).toBe("3");
    expect(host.value).toBe("3");
  });
});

describe("qui-input number constraints", () => {
  it("defaults number inputs to numeric input mode", async () => {
    const { root } = await render(<qui-input inputType="number" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.inputMode).toBe("numeric");
  });

  it("keeps an explicit input mode on number inputs", async () => {
    const { root } = await render(<qui-input inputType="number" inputModeHint="decimal" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.inputMode).toBe("decimal");
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
      <qui-input inputType="number" inputModeHint="decimal" step="any" value={1.5} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

    expect(input.step).toBe("any");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2.5");

    decrement.click();
    await waitForChanges();
    expect(input.value).toBe("1.5");
  });

  it("snaps stepper values to the step grid", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" inputModeHint="decimal" value={1.5} step={1} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2");

    decrement.click();
    await waitForChanges();
    expect(input.value).toBe("1");
  });

  it("reads a numeric step from an attribute", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" value={0} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    host.setAttribute("step", "2");
    await waitForChanges();
    expect(input.step).toBe("2");
    expect(host.step).toBe(2);

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2");
  });

  it("falls back to one for a zero step", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={0} step={0} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("1");
  });

  it("falls back to one for a negative step", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={0} step={-1} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("1");
  });

  it("falls back to one for an empty step attribute", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" value={0} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    host.setAttribute("step", "");
    await waitForChanges();

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("1");
  });

  it("falls back to one for an invalid step attribute", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" value={0} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    host.setAttribute("step", "invalid");
    await waitForChanges();
    expect(host.step).toBeUndefined();

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("1");
  });
});
