import { describe, expect, h, it, render } from "@stencil/vitest";
import { userEvent } from "vitest/browser";

import { queryControl, resolveHost } from "../../../tests/test-utils/component";
import { typeInto } from "../../../tests/test-utils/interactions";
import { isHTMLFormElement } from "../shared/helpers/dom/dom";

describe("qui-input with Playwright", () => {
  it("types through a compact mask and emits the unmasked value", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      h("qui-input", { mask: "(###) ###-####" }),
    );
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "5551234567");
    await waitForChanges();

    expect(input.value).toBe("(555) 123-4567");
    expect(spy).toHaveReceivedEventDetail({
      value: "(555) 123-4567",
      unmaskedValue: "5551234567",
    });
  });

  it("inserts escaped literals while typing", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { mask: String.raw`\A-####` }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "1234");
    await waitForChanges();

    expect(input.value).toBe("A-1234");
  });

  it("drops characters that the mask does not accept", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { mask: "###-###" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "12a3b4");
    await waitForChanges();

    expect(input.value).toBe("123-4");
  });

  it("keeps the caret when numeric mode rejects a character", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { inputModeHint: "numeric" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "123");
    input.focus();
    input.setSelectionRange(0, 0);

    await userEvent.keyboard("+");
    await waitForChanges();
    expect(input.value).toBe("123");
    expect(input.selectionStart).toBe(0);

    await userEvent.keyboard("-");
    await waitForChanges();
    expect(input.value).toBe("-123");
    expect(input.selectionStart).toBe(1);
  });

  it("keeps the caret when typing a leading decimal separator", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { inputType: "number" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, ".5");
    await waitForChanges();

    expect(input.value).toBe("0.5");
    expect(input.selectionStart).toBe(3);
  });

  it("keeps the caret when typing a leading negative decimal", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { inputType: "number" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "-.5");
    await waitForChanges();

    expect(input.value).toBe("-0.5");
    expect(input.selectionStart).toBe(4);
  });

  it("normalizes a leading comma decimal separator", async () => {
    const { root, waitForChanges } = await render(
      h("qui-input", { inputType: "number", numberLocale: "de-DE" }),
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await waitForChanges();
    typeInto(input, ",5");
    await waitForChanges();

    expect(input.value).toBe("0.5");
  });

  it("emits valuechange once when Maskito corrects an input event", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(h("qui-input", { mask: "###-###" }));
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "12a3b4");
    await waitForChanges();

    expect(input.value).toBe("123-4");
    expect(spy).toHaveReceivedEventTimes(1);
  });

  it("restores masking after the element is reconnected", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { mask: "###-###" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const parent = host.parentElement;
    if (parent === null) {
      throw new TypeError("Expected a parent element");
    }

    host.remove();
    await waitForChanges();
    parent.append(host);
    await waitForChanges();

    typeInto(input, "123456");
    await waitForChanges();

    expect(input.value).toBe("123-456");
  });

  it("supports a native Maskito mask expression from JavaScript", async () => {
    const { root, waitForChanges } = await render(
      h("qui-input", {
        maskExpression: [/\d/u, /\d/u, "-", /\d/u, /\d/u],
      }),
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "1234");
    await waitForChanges();

    expect(input.value).toBe("12-34");
    expect(host.hasAttribute("mask-expression")).toBe(false);
  });

  it("steps a number input with a real click", async () => {
    const { root, waitForChanges } = await render(
      h("qui-input", { inputType: "number", value: 2, min: 1, max: 3 }),
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");
    const increment = queryControl<HTMLButtonElement>(host, "[data-part=increment-trigger]");

    await userEvent.click(increment);
    await waitForChanges();

    expect(input.value).toBe("3");
    expect(increment.disabled).toBe(true);
  });

  it("allows a partial negative number while editing", async () => {
    const { root, waitForChanges } = await render(
      h("form", null, h("qui-input", { inputType: "number", name: "qty" })),
    );
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.click(input);
    await userEvent.keyboard("-");
    await waitForChanges();

    expect(input.value).toBe("-");
    expect(form.checkValidity()).toBe(true);

    input.blur();
    await waitForChanges();

    expect(form.checkValidity()).toBe(false);
  });

  it("accepts decimal input through the keyboard", async () => {
    const { root, waitForChanges } = await render(h("qui-input", { inputType: "number" }));
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await userEvent.type(input, "12.5");
    await waitForChanges();

    expect(input.value).toBe("12.5");
  });
});
