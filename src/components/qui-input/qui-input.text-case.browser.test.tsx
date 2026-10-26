import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, resolveHost } from "../../test-utils/component";
import { typeInto } from "../../test-utils/interactions";

describe("qui-input text case", () => {
  it("normalizes typed values to uppercase", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-input textCase="uppercase" />);
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "ab-12");
    await waitForChanges();

    expect(input.value).toBe("AB-12");
    expect(spy).toHaveReceivedEventDetail({ value: "AB-12", unmaskedValue: "AB-12" });
  });

  it("normalizes email values without using the unsupported selection API", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-input inputType="email" textCase="lowercase" />,
    );
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "USER@EXAMPLE.COM");
    await waitForChanges();

    expect(input.value).toBe("user@example.com");
    expect(spy).toHaveReceivedEventDetail({
      value: "user@example.com",
      unmaskedValue: "user@example.com",
    });
  });

  it("restores the caret after a length-changing case mapping", async () => {
    const { root, waitForChanges } = await render(<qui-input textCase="uppercase" />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    input.value = "aßb";
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();

    expect(input.value).toBe("ASSB");
    expect(input.selectionStart).toBe(3);
  });

  it("normalizes the defaultValue", async () => {
    const { root, waitForChanges } = await render(
      <qui-input textCase="uppercase" defaultValue="abc" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await waitForChanges();
    expect(input.value).toBe("ABC");
  });

  it("normalizes initial and controlled values to lowercase", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-input textCase="lowercase" value="ABC" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await waitForChanges();
    expect(input.value).toBe("abc");

    await setProps({ value: "DEF" });
    await waitForChanges();
    expect(input.value).toBe("def");
  });

  it("applies case before a mask and keeps the caret stable", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-input textCase="uppercase" maskPattern="aa-####" />,
    );
    const spy = spyOnEvent("valuechange");
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    input.value = "ab1234";
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();

    expect(input.value).toBe("AB-1234");
    expect(input.selectionStart).toBe(2);
    expect(spy).toHaveReceivedEventDetail({ value: "AB-1234", unmaskedValue: "AB1234" });
  });

  it("re-masks from raw data when textCase changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-input maskPattern="+1 ### ### ####" textCase="uppercase" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "5551234567");
    await waitForChanges();
    expect(input.value).toBe("+1 555 123 4567");

    await setProps({ textCase: "lowercase" });
    await waitForChanges();
    expect(input.value).toBe("+1 555 123 4567");
  });

  it("preserves mask literal case when textCase changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-input maskPattern="X-aa-####" textCase="uppercase" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    typeInto(input, "ab1234");
    await waitForChanges();
    expect(input.value).toBe("X-AB-1234");

    await setProps({ textCase: "lowercase" });
    await waitForChanges();
    expect(input.value).toBe("X-ab-1234");
  });

  it("re-normalizes when textCase changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-input textCase="uppercase" value="Hello" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await waitForChanges();
    expect(input.value).toBe("HELLO");

    await setProps({ textCase: "lowercase" });
    await waitForChanges();
    expect(input.value).toBe("hello");
  });

  it("ignores textCase for number inputs", async () => {
    const { root, waitForChanges } = await render(
      <qui-input inputType="number" textCase="uppercase" value="1e3" />,
    );
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    await waitForChanges();
    expect(input.value).toBe("1e3");
    expect(input.hasAttribute("autocapitalize")).toBe(false);
  });

  it("derives the native autocapitalize hint from textCase", async () => {
    const { root, setProps, waitForChanges } = await render(<qui-input />);
    const host = resolveHost<HTMLQuiInputElement>(root, "qui-input");
    const input = queryControl<HTMLInputElement>(host, "input");

    expect(input.hasAttribute("autocapitalize")).toBe(false);

    await setProps({ textCase: "uppercase" });
    await waitForChanges();
    expect(input.getAttribute("autocapitalize")).toBe("characters");

    await setProps({ textCase: "lowercase" });
    await waitForChanges();
    expect(input.getAttribute("autocapitalize")).toBe("none");

    await setProps({ textCase: "uppercase", autocapitalizeHint: "words" });
    await waitForChanges();
    expect(input.getAttribute("autocapitalize")).toBe("words");

    await setProps({ textCase: "none", autocapitalizeHint: "sentences" });
    await waitForChanges();
    expect(input.getAttribute("autocapitalize")).toBe("sentences");

    await setProps({ autocapitalizeHint: undefined });
    await waitForChanges();
    expect(input.hasAttribute("autocapitalize")).toBe(false);
  });
});
