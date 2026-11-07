import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, resolveHost } from "../../../tests/test-utils/component";
import { typeInto } from "../../../tests/test-utils/interactions";
import { isHTMLFormElement } from "../shared/helpers/dom/dom";

describe("qui-input numeric", () => {
  it("strips non-numeric characters when input mode is numeric", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-input inputModeHint="numeric" mask="###-###" />,
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

  it("sanitizes supported input types when the hint is set", async () => {
    const { root } = await render(
      <qui-input inputType="tel" inputModeHint="numeric" value="a1b2" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("12");
    expect(host.value).toBe("12");
  });

  it("filters url inputs when the hint is set", async () => {
    const { root } = await render(
      <qui-input inputType="url" inputModeHint="numeric" value="a1b2" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("12");
    expect(host.value).toBe("12");
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

  it("normalizes number values as a plain decimal", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" value="001,5" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.value).toBe("1.5");

    host.inputType = "text";
    await waitForChanges();

    expect(input.value).toBe("1.5");
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

  it("normalizes leading zeros and repeated punctuation", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="numeric" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "0123");
    await waitForChanges();
    expect(input.value).toBe("123");

    typeInto(input, "0");
    await waitForChanges();
    expect(input.value).toBe("0");

    typeInto(input, "-012");
    await waitForChanges();
    expect(input.value).toBe("-12");

    typeInto(input, "1--2");
    await waitForChanges();
    expect(input.value).toBe("12");
  });
});

describe("qui-input decimal", () => {
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

  it("normalizes leading zeros and repeated punctuation", async () => {
    const { root, waitForChanges } = await render(<qui-input inputModeHint="decimal" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "00.5");
    await waitForChanges();
    expect(input.value).toBe("0.5");

    typeInto(input, "1..2");
    await waitForChanges();
    expect(input.value).toBe("1.2");

    typeInto(input, "1,,2");
    await waitForChanges();
    expect(input.value).toBe("1,2");

    typeInto(input, "-.5");
    await waitForChanges();
    expect(input.value).toBe("-0.5");
  });

  it("accepts negative decimals in number inputs", async () => {
    const { root } = await render(<qui-input inputType="number" step="any" value={-1.5} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.type).toBe("text");
    expect(input.value).toBe("-1.5");
  });
});

describe("qui-input numeric values", () => {
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

  it("filters disallowed characters from number inputs", async () => {
    const { root, waitForChanges } = await render(<qui-input inputType="number" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "1s2.3.4");
    await waitForChanges();

    expect(input.value).toBe("12.34");

    typeInto(input, "-5");
    await waitForChanges();

    expect(input.value).toBe("-5");
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

  it("validates number constraints through the form", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-input inputType="number" name="qty" value={5} min={1} max={3} step={1} />
      </form>,
    );
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.type).toBe("text");
    expect(input.hasAttribute("min")).toBe(false);
    expect(input.hasAttribute("max")).toBe(false);
    expect(input.hasAttribute("step")).toBe(false);
    expect(form.checkValidity()).toBe(false);

    host.value = 2;
    await waitForChanges();

    expect(form.checkValidity()).toBe(true);
  });

  it("reports range underflow and step mismatch", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-input inputType="number" name="qty" value={0.5} min={1} max={3} step={1} />
      </form>,
    );
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");

    expect(form.checkValidity()).toBe(false);

    host.value = 1.5;
    await waitForChanges();
    expect(form.checkValidity()).toBe(false);

    host.value = 2;
    await waitForChanges();
    expect(form.checkValidity()).toBe(true);
  });

  it("updates stepper availability while typing", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={1} min={1} max={3} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

    typeInto(input, "3");
    await waitForChanges();
    expect(increment.disabled).toBe(true);
    expect(decrement.disabled).toBe(false);

    typeInto(input, "1");
    await waitForChanges();
    expect(increment.disabled).toBe(false);
    expect(decrement.disabled).toBe(true);
  });

  it("disables the stepper when the input is disabled", async () => {
    const { root } = await render(<qui-input inputType="number" value={1} disabled />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

    expect(increment.disabled).toBe(true);
    expect(decrement.disabled).toBe(true);
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
    const decrement = queryControl<HTMLButtonElement>(host, "[data-part=decrement-trigger]");

    expect(input.type).toBe("text");

    increment.click();
    await waitForChanges();
    expect(input.value).toBe("2.5");

    decrement.click();
    await waitForChanges();
    expect(input.value).toBe("1.5");
  });

  it("snaps stepper values to the step grid", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" value={1.5} step={1} />,
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
