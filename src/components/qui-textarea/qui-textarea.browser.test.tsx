import { describe, expect, h, it, render } from "@stencil/vitest";

function isTextareaHost(element: HTMLElement): element is HTMLQuiTextareaElement {
  return element.tagName === "QUI-TEXTAREA";
}

function queryHost(root: HTMLElement): HTMLQuiTextareaElement | null {
  if (isTextareaHost(root)) {
    return root;
  }
  return root.querySelector<HTMLQuiTextareaElement>("qui-textarea");
}

function queryTextarea(root: HTMLElement): HTMLTextAreaElement {
  const textarea = root.querySelector("textarea");
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new TypeError("Expected a native textarea");
  }
  return textarea;
}

// oxlint-disable-next-line unicorn/prefer-number-coercion
const pixels = (value: string): number => Number.parseFloat(value);

async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe("qui-textarea", () => {
  it("emits the current value on input", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(<qui-textarea />);
    const spy = spyOnEvent("valuechange");
    const textarea = queryTextarea(root);

    textarea.value = "first line\nsecond line";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();

    expect(textarea.value).toBe("first line\nsecond line");
    expect(spy).toHaveReceivedEventDetail({ value: "first line\nsecond line" });
  });

  it("syncs defaultValue and controlled values", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea defaultValue="initial" />,
    );
    const textarea = queryTextarea(root);

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
    const textarea = queryTextarea(root);
    const counter = root.querySelector("[data-part=counter]");

    await waitForChanges();
    expect(textarea.maxLength).toBe(5);
    expect(counter?.textContent).toBe("3/5");
    expect(counter?.getAttribute("part")).toBe("counter");
    expect(textarea.getAttribute("aria-describedby")).toContain(counter?.id);

    textarea.value = "abcd";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();
    expect(counter?.textContent).toBe("4/5");
  });

  it("updates the counter for controlled value changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-textarea value="abc" maxLength={5} showCount />,
    );
    const counter = root.querySelector("[data-part=counter]");

    await waitForChanges();
    await setProps({ value: "ab" });
    await waitForChanges();
    expect(counter?.textContent).toBe("2/5");
  });

  it("forwards minLength and maxLength attributes", async () => {
    const { root, waitForChanges } = await render(<qui-textarea minLength={3} maxLength={5} />);
    const textarea = queryTextarea(root);

    await waitForChanges();
    expect(textarea.minLength).toBe(3);
    expect(textarea.maxLength).toBe(5);
  });

  it("merges the counter and helper text into aria-describedby", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="bio">
        <qui-field-label>Bio</qui-field-label>
        <qui-textarea showCount maxLength={10} />
        <qui-field-helper-text>Keep it short.</qui-field-helper-text>
      </qui-field>,
    );
    await waitForChanges();
    const textarea = queryTextarea(root);
    const counter = root.querySelector("[data-part=counter]");
    const helper = root.querySelector("[part=helper-text]");
    const describedBy = textarea.getAttribute("aria-describedby") ?? "";

    expect(counter?.id).not.toBe("");
    expect(helper?.id).not.toBe("");
    expect(describedBy).toContain(counter?.id);
    expect(describedBy).toContain(helper?.id);
  });

  it("omits the counter by default", async () => {
    const { root } = await render(<qui-textarea />);

    expect(root.querySelector("[data-part=counter]")).toBeNull();
  });

  it("shows a plain character count without maxLength", async () => {
    const { root, waitForChanges } = await render(<qui-textarea value="abc" showCount />);
    const counter = root.querySelector("[data-part=counter]");

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
    const textarea = queryTextarea(root);
    const label = root.querySelector<HTMLLabelElement>("[part=label]");

    expect(textarea.id).toBe("bio::control");
    expect(label?.htmlFor).toBe("bio::control");
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
    const textarea = queryTextarea(root);

    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
  });
});

describe("qui-textarea forms and sizing", () => {
  it("exposes the resize mode", async () => {
    const { root } = await render(<qui-textarea resize="auto" />);
    const textarea = queryTextarea(root);

    expect(textarea.dataset.resize).toBe("auto");
    expect(textarea.getAttribute("rows")).toBe("4");
  });

  it("maps resize modes to the native resize style", async () => {
    const { root, setProps, waitForChanges } = await render(<qui-textarea resize="none" />);
    const textarea = queryTextarea(root);

    expect(getComputedStyle(textarea).resize).toBe("none");

    await setProps({ resize: "vertical" });
    await waitForChanges();
    expect(getComputedStyle(textarea).resize).toBe("vertical");
  });

  it("grows a resize=auto textarea with its content", async () => {
    const { root, waitForChanges } = await render(<qui-textarea resize="auto" rows={2} />);
    const textarea = queryTextarea(root);

    await nextFrame();
    await waitForChanges();
    const initialHeight = textarea.getBoundingClientRect().height;

    textarea.value = Array.from({ length: 8 }, (_value, position) => `line ${position}`).join("\n");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();
    await nextFrame();
    await waitForChanges();

    expect(textarea.style.height).toMatch(/px$/u);
    expect(textarea.getBoundingClientRect().height).toBeGreaterThan(initialHeight);
    expect(textarea.scrollHeight).toBeLessThanOrEqual(textarea.clientHeight);
  });

  it("caps auto-growth at maxRows and scrolls", async () => {
    const { root, waitForChanges } = await render(
      <qui-textarea resize="auto" rows={2} maxRows={3} />,
    );
    const textarea = queryTextarea(root);

    textarea.value = Array.from({ length: 20 }, (_value, position) => `line ${position}`).join(
      "\n",
    );
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
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
    const form = root instanceof HTMLFormElement ? root : root.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError("Expected a form");
    }
    expect(new FormData(form).get("bio")).toBe("initial");

    const host = queryHost(root);
    if (host === null) {
      throw new TypeError("Expected a textarea host");
    }
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
    const form = root instanceof HTMLFormElement ? root : root.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError("Expected a form");
    }
    const textarea = queryTextarea(root);
    textarea.value = "edited";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();
    expect(new FormData(form).get("bio")).toBe("edited");

    form.reset();
    await waitForChanges();
    expect(textarea.value).toBe("initial");
    expect(new FormData(form).get("bio")).toBe("initial");
  });

  it("restores form state", async () => {
    const { root, waitForChanges } = await render(<qui-textarea defaultValue="initial" />);
    const textarea = queryTextarea(root);
    const host = queryHost(root);
    if (host === null) {
      throw new TypeError("Expected a textarea host");
    }
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
    const form = root instanceof HTMLFormElement ? root : root.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError("Expected a form");
    }
    expect(form.checkValidity()).toBe(false);

    const textarea = queryTextarea(root);
    textarea.value = "hello";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();
    expect(form.checkValidity()).toBe(true);
  });

  it("keeps rows as the minimum when maxRows is smaller", async () => {
    const { root, waitForChanges } = await render(
      <qui-textarea resize="auto" rows={4} maxRows={2} />,
    );
    const textarea = queryTextarea(root);

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
    const textarea = queryTextarea(root);

    await nextFrame();
    await waitForChanges();
    expect(textarea.style.height).toMatch(/px$/u);

    await setProps({ resize: "vertical" });
    await waitForChanges();
    expect(textarea.style.height).toBe("");
    expect(textarea.style.overflowY).toBe("");
  });

  it("re-establishes auto-growth after re-attachment", async () => {
    const { root, waitForChanges } = await render(<qui-textarea resize="auto" rows={2} />);
    const textarea = queryTextarea(root);

    root.remove();
    document.body.append(root);
    await nextFrame();
    await waitForChanges();

    expect(textarea.style.height).toMatch(/px$/u);
    root.remove();
  });
});
