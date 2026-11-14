import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../../tests/test-utils/component";
import { nextFrame, waitForShadowStyles } from "../../../tests/test-utils/dom-ready";
import { expectFocusedDeep, typeInto } from "../../../tests/test-utils/interactions";
import { isHTMLFormElement } from "../shared/helpers/dom/dom";

function queryVisibilityTrigger(host: Element): HTMLButtonElement {
  return queryControl<HTMLButtonElement>(host, "[data-part=visibility-trigger]");
}

describe("qui-input", () => {
  it("applies a mask and emits both masked and unmasked values", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-input mask="###-###" />);
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "123456");
    await waitForChanges();

    expect(input.value).toBe("123-456");
    expect(spy).toHaveReceivedEventDetail({ value: "123-456", unmaskedValue: "123456" });
  });

  it("returns the live value for uncontrolled edits", async () => {
    const { root, waitForChanges } = await render(<qui-input />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "hello");
    await waitForChanges();

    await expect(host.getValue()).resolves.toBe("hello");
  });

  it("accepts a native Maskito mask expression", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-input maskExpression={[/\d/u, /\d/u, "-", /\d/u, /\d/u]} />,
    );
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "1234");
    await waitForChanges();

    expect(input.value).toBe("12-34");
    expect(spy).toHaveReceivedEventDetail({ value: "12-34", unmaskedValue: "1234" });
    expect(host.hasAttribute("mask-expression")).toBe(false);
  });

  it("prefers a native mask expression over the string mask", async () => {
    const { root, waitForChanges } = await render(
      <qui-input mask="###" maskExpression={[/\d/u, /\d/u, "-", /\d/u, /\d/u]} />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "1234");
    await waitForChanges();

    expect(input.value).toBe("12-34");
  });

  it("revalidates when the input pattern changes", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-input name="code" inputPattern={String.raw`\d+`} value="abc" />
      </form>,
    );
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");

    expect(form.checkValidity()).toBe(false);

    host.inputPattern = String.raw`[a-z]+`;
    await waitForChanges();

    expect(form.checkValidity()).toBe(true);
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

  it("renders url inputs with keyboard hints", async () => {
    const { root } = await render(<qui-input inputType="url" keyboardHint="go" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.type).toBe("url");
    expect(input.enterKeyHint).toBe("go");
  });

  it("clears the keyboard hint when reset", async () => {
    const { root, setProps, waitForChanges } = await render(<qui-input keyboardHint="go" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await setProps({ keyboardHint: "" });
    await waitForChanges();

    expect(input.hasAttribute("enterkeyhint")).toBe(false);
  });

  it("forwards spellcheck hints to supported inputs", async () => {
    const { root } = await render(<qui-input spellcheckHint={false} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.spellcheck).toBe(false);
  });

  it("does not forward spellcheck to unsupported inputs", async () => {
    const { root } = await render(<qui-input inputType="password" spellcheckHint={false} />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.hasAttribute("spellcheck")).toBe(false);
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

  it("does not reserve affix padding when the slots are empty", async () => {
    const { root, waitForChanges } = await render(<qui-input />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    await waitForShadowStyles(host);
    await waitForChanges();
    await nextFrame();

    const prefix = queryControl<HTMLSpanElement>(host, "[data-part=prefix]");
    const suffix = queryControl<HTMLSpanElement>(host, "[data-part=suffix]");
    expect(getComputedStyle(prefix).paddingInlineStart).toBe("0px");
    expect(getComputedStyle(suffix).paddingInlineEnd).toBe("0px");
  });

  it("pads filled affixes", async () => {
    const { root, waitForChanges } = await render(
      <qui-input>
        <span slot="prefix">$</span>
        <span slot="suffix">.00</span>
      </qui-input>,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    await waitForShadowStyles(host);
    await waitForChanges();
    await nextFrame();

    const prefix = queryControl<HTMLSpanElement>(host, "[data-part=prefix]");
    const suffix = queryControl<HTMLSpanElement>(host, "[data-part=suffix]");
    expect(getComputedStyle(prefix).paddingInlineStart).toBe("12px");
    expect(getComputedStyle(suffix).paddingInlineEnd).toBe("12px");
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

describe("qui-input render scoping", () => {
  it("updates a controlled value without re-rendering the root", async () => {
    const { root, spies, setProps } = await render(<qui-input value="first" />, {
      spyOn: {
        components: {
          "qui-input": { lifecycle: ["render"] },
        },
      },
    });
    const input = queryControl<HTMLInputElement>(
      resolveHost<HTMLQuiInputElement>(root, "qui-input"),
      "input",
    );
    const renders = (): number => spies?.lifecycle.render?.mock.calls.length ?? 0;
    const baseline = renders();

    await setProps({ value: "second" });

    expect(renders()).toBe(baseline);
    expect(input.value).toBe("second");
  });
});

describe("qui-input field colors", () => {
  it("applies field color custom properties", async () => {
    const { root, waitForChanges } = await render(<qui-input placeholder="Email" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const control = queryPartIn(host, "control");
    const input = queryControl<HTMLInputElement>(host, "input");
    control.style.setProperty("transition", "none", "important");

    host.style.setProperty("--qui-field-container-color", "rgb(1, 2, 3)");
    host.style.setProperty("--qui-field-outline-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-outline-hover-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-text-color", "rgb(7, 8, 9)");
    host.style.setProperty("--qui-field-placeholder-color", "rgb(10, 11, 12)");
    host.style.setProperty("--qui-field-error-color", "rgb(13, 14, 15)");

    expect(getComputedStyle(control).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(control).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(input).color).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(input, "::placeholder").color).toBe("rgb(10, 11, 12)");

    host.style.setProperty("--qui-field-outline-hover-color", "rgb(13, 14, 15)");
    host.invalid = true;
    await waitForChanges();
    expect(getComputedStyle(control).borderTopColor).toBe("rgb(13, 14, 15)");
  });
});
