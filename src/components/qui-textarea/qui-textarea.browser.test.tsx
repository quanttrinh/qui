import { describe, expect, h, it, render } from "@stencil/vitest";

import { isHTMLFormElement } from "../../helpers/dom";
import { queryControl, queryPartIn, resolveHost } from "../../test-utils/component";
import { nextFrame, waitForShadowStyles } from "../../test-utils/dom-ready";
import { expectFocusedDeep, typeInto } from "../../test-utils/interactions";
import { deepQuery, queryInside } from "../../test-utils/shadow";

// oxlint-disable-next-line unicorn/prefer-number-coercion
const pixels = (value: string): number => Number.parseFloat(value);

const PIXELS = /px$/u;

function queryCounter(root: HTMLElement): HTMLElement | null {
  return queryInside<HTMLElement>(
    resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
    "[data-part=counter]",
  );
}

describe("qui-textarea", () => {
  it("emits the current value on input", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-textarea />);
    const spy = spyOnEvent("valuechange");
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );

    typeInto(textarea, "first line\nsecond line");
    await waitForChanges();

    expect(textarea.value).toBe("first line\nsecond line");
    expect(spy).toHaveReceivedEventDetail({ value: "first line\nsecond line" });
  });

  it("syncs defaultValue and controlled values", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea defaultValue="initial" />,
    );
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );

    await waitForChanges();
    expect(textarea.value).toBe("initial");

    await setProps({ value: "controlled" });
    await waitForChanges();
    expect(textarea.value).toBe("controlled");
  });

  it("shows a character counter", async () => {
    const { root, waitForChanges } = await render(
      <qui-textarea value="abc" maxLength={5} showCount />,
    );
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    const counter = queryCounter(root);

    await waitForChanges();
    expect(textarea.maxLength).toBe(5);
    expect(counter?.textContent).toBe("3/5");
    expect(counter?.getAttribute("part")).toBe("counter");
    expect(Reflect.get(textarea, "ariaDescribedByElements")).toEqual([counter]);

    typeInto(textarea, "abcd");
    await waitForChanges();
    expect(counter?.textContent).toBe("4/5");
  });

  it("updates the counter for controlled value changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea value="abc" maxLength={5} showCount />,
    );
    const counter = queryCounter(root);

    await waitForChanges();
    await setProps({ value: "ab" });
    await waitForChanges();
    expect(counter?.textContent).toBe("2/5");
  });

  it("forwards minLength and maxLength attributes", async () => {
    const { root, waitForChanges } = await render(<qui-textarea minLength={3} maxLength={5} />);
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );

    await waitForChanges();
    expect(textarea.minLength).toBe(3);
    expect(textarea.maxLength).toBe(5);
  });

  it("merges the counter and helper text into ariaDescribedByElements", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="bio">
        <qui-field-label>Bio</qui-field-label>
        <qui-textarea showCount maxLength={10} />
        <qui-field-helper-text>Keep it short.</qui-field-helper-text>
      </qui-field>,
    );
    await waitForChanges();
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    const counter = queryCounter(root);
    const helperHost = deepQuery<HTMLElement>(root, "qui-field-helper-text");
    if (helperHost === null || counter === null) {
      throw new TypeError("Expected the counter and helper text");
    }

    expect(counter.id).not.toBe("");
    expect(helperHost.id).not.toBe("");
    expect(Reflect.get(textarea, "ariaDescribedByElements")).toEqual([helperHost, counter]);
  });

  it("clears counter ARIA when the counter is removed", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea value="abc" maxLength={10} showCount />,
    );
    await waitForChanges();
    const textarea = queryPartIn<HTMLTextAreaElement>(root, "textarea");
    const counter = queryCounter(root);

    expect(Reflect.get(textarea, "ariaDescribedByElements")).toEqual([counter]);

    await setProps({ showCount: false });
    await waitForChanges();
    expect(Reflect.get(textarea, "ariaDescribedByElements")).toEqual([]);

    await setProps({ showCount: true });
    await waitForChanges();
    expect(Reflect.get(textarea, "ariaDescribedByElements")).toEqual([queryCounter(root)]);
  });

  it("omits the counter by default", async () => {
    const { root } = await render(<qui-textarea />);

    expect(queryCounter(root)).toBeNull();
  });

  it("shows a plain character count without maxLength", async () => {
    const { root, waitForChanges } = await render(<qui-textarea value="abc" showCount />);
    const counter = queryCounter(root);

    await waitForChanges();
    expect(counter?.textContent).toBe("3");
  });

  it("inherits field ids, state, and ARIA", async () => {
    const { root } = await render(
      <qui-field id="bio" required invalid>
        <qui-field-label>Bio</qui-field-label>
        <qui-textarea />
      </qui-field>,
    );
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    const labelHost = deepQuery<HTMLElement>(root, "qui-field-label");
    if (labelHost === null) {
      throw new TypeError("Expected a field label");
    }
    const label = queryPartIn<HTMLLabelElement>(labelHost, "label");

    expect(textarea.id).toBe("bio::control");
    expect(label.htmlFor).toBe("bio::control");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-required")).toBe("true");
    expect(textarea).toHaveAttribute("data-required");
  });

  it("inherits disabled and read-only state", async () => {
    const { root } = await render(
      <qui-field disabled readOnly>
        <qui-textarea />
      </qui-field>,
    );
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );

    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
  });
});

describe("qui-textarea forms and sizing", () => {
  it("exposes the resize mode", async () => {
    const { root } = await render(<qui-textarea resize="auto" />);
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );

    expect(textarea.dataset.resize).toBe("auto");
    expect(textarea.getAttribute("rows")).toBe("4");
  });

  it("maps resize modes to the native resize style", async () => {
    const { root, setProps, waitForChanges } = await render(<qui-textarea resize="none" />);
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    expect(getComputedStyle(textarea).resize).toBe("none");

    await setProps({ resize: "vertical" });
    await waitForChanges();
    expect(getComputedStyle(textarea).resize).toBe("vertical");
  });

  it("grows a resize=auto textarea with its content", async () => {
    const { root, waitForChanges } = await render(<qui-textarea resize="auto" rows={2} />);
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    await nextFrame();
    await waitForChanges();
    const initialHeight = textarea.getBoundingClientRect().height;

    typeInto(
      textarea,
      Array.from({ length: 8 }, (_value, position) => `line ${position}`).join("\n"),
    );
    await waitForChanges();
    await nextFrame();
    await waitForChanges();

    expect(textarea.style.height).toMatch(PIXELS);
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(initialHeight);
    expect(textarea.scrollHeight).toBeLessThanOrEqual(textarea.clientHeight);
  });

  it("caps auto-growth at maxRows and scrolls", async () => {
    const { root, waitForChanges } = await render(
      <qui-textarea resize="auto" rows={2} maxRows={3} />,
    );
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    typeInto(
      textarea,
      Array.from({ length: 20 }, (_value, position) => `line ${position}`).join("\n"),
    );
    await waitForChanges();
    await nextFrame();
    await waitForChanges();

    expect(textarea.style.overflowY).toBe("auto");
    const computed = getComputedStyle(textarea);
    const chrome =
      pixels(computed.paddingTop) +
      pixels(computed.paddingBottom) +
      pixels(computed.borderTopWidth) +
      pixels(computed.borderBottomWidth);
    const maxHeight = pixels(computed.lineHeight) * 3 + chrome;
    expect(pixels(textarea.style.height)).toBeLessThanOrEqual(maxHeight);
  });
});

describe("qui-textarea form state", () => {
  it("submits and clears its form value when disabled", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-textarea name="bio" defaultValue="initial" />
      </form>,
    );
    await waitForChanges();
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    expect(new FormData(form).get("bio")).toBe("initial");

    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    host.disabled = true;
    await waitForChanges();
    expect(new FormData(form).get("bio")).toBeNull();

    host.disabled = false;
    await waitForChanges();
    expect(new FormData(form).get("bio")).toBe("initial");
  });

  it("resets edited form values", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-textarea name="bio" defaultValue="initial" />
      </form>,
    );
    await waitForChanges();
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    typeInto(textarea, "edited");
    await waitForChanges();
    expect(new FormData(form).get("bio")).toBe("edited");

    form.reset();
    await waitForChanges();
    expect(textarea.value).toBe("initial");
    expect(new FormData(form).get("bio")).toBe("initial");
  });

  it("restores form state", async () => {
    const { root, waitForChanges } = await render(<qui-textarea defaultValue="initial" />);
    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const restore = Reflect.get(host, "formStateRestoreCallback") as (state: string) => void;

    restore.call(host, JSON.stringify(["restored"]));
    await waitForChanges();
    expect(textarea.value).toBe("restored");
  });

  it("participates in form validation", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-textarea name="bio" required />
      </form>,
    );
    await waitForChanges();
    const form = isHTMLFormElement(root) ? root : root.querySelector("form");
    if (!isHTMLFormElement(form)) {
      throw new TypeError("Expected a form");
    }
    expect(form.checkValidity()).toBe(false);

    const textarea = queryControl<HTMLTextAreaElement>(
      resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea"),
      "textarea",
    );
    typeInto(textarea, "hello");
    await waitForChanges();
    expect(form.checkValidity()).toBe(true);
  });

  it("keeps rows as the minimum when maxRows is smaller", async () => {
    const { root, waitForChanges } = await render(
      <qui-textarea resize="auto" rows={4} maxRows={2} />,
    );
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    await nextFrame();
    await waitForChanges();
    const computed = getComputedStyle(textarea);
    const lineHeight = pixels(computed.lineHeight);
    const chrome =
      pixels(computed.paddingTop) +
      pixels(computed.paddingBottom) +
      pixels(computed.borderTopWidth) +
      pixels(computed.borderBottomWidth);

    expect(pixels(textarea.style.height)).toBeGreaterThanOrEqual(lineHeight * 4 + chrome - 1);
  });

  it("clears inline growth styles when leaving auto mode", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea resize="auto" rows={2} />,
    );
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    await nextFrame();
    await waitForChanges();
    expect(textarea.style.height).toMatch(PIXELS);

    await setProps({ resize: "vertical" });
    await waitForChanges();
    expect(textarea.style.height).toBe("");
    expect(textarea.style.overflowY).toBe("");
  });

  it("re-establishes auto-growth after re-attachment", async () => {
    const { root, waitForChanges } = await render(<qui-textarea resize="auto" rows={2} />);
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    await waitForShadowStyles(host);
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    root.remove();
    document.body.append(root);
    await nextFrame();
    await waitForChanges();

    expect(textarea.style.height).toMatch(PIXELS);
    root.remove();
  });

  it("focuses the internal native textarea", async () => {
    const { root, waitForChanges } = await render(<qui-textarea />);
    const host = resolveHost<HTMLQuiTextareaElement>(root, "qui-textarea");
    const textarea = queryControl<HTMLTextAreaElement>(host, "textarea");

    await host.focusControl();
    await waitForChanges();

    expectFocusedDeep(textarea);
  });
});
