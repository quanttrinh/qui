import { describe, expect, h, it, render } from "@stencil/vitest";

function queryInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector("qui-input")?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Expected the field input");
  }
  return input;
}

describe("qui-field", () => {
  it("wires ids and ARIA across label, helper text, and error text", async () => {
    const { root } = await render(
      <qui-field id="email" required invalid>
        <qui-field-label>Email</qui-field-label>
        <qui-input />
        <qui-field-helper-text>Helper</qui-field-helper-text>
        <qui-field-error-text>Error</qui-field-error-text>
      </qui-field>,
    );
    const label = root.querySelector<HTMLLabelElement>("[part=label]");
    const input = queryInput(root);
    const helper = root.querySelector("[part=helper-text]");
    const error = root.querySelector("[part=error-text]");

    expect(label).toHaveAttribute("data-required");
    expect(root).toHaveAttribute("data-invalid");
    expect(label?.id).toBe("email::label");
    expect(label?.htmlFor).toBe("email::control");
    expect(input.id).toBe("email::control");
    expect(input.getAttribute("aria-describedby")).toBe("email::helper-text");
    expect(input.getAttribute("aria-errormessage")).toBe("email::error-text");
    expect(helper?.id).toBe("email::helper-text");
    expect(error?.id).toBe("email::error-text");
  });

  it("does not let host part attributes break context lifecycles", async () => {
    const { root, waitForChanges } = await render(
      <qui-field id="field" required>
        <qui-field-label>
          Label
          <qui-field-required-indicator />
        </qui-field-label>
        <qui-input />
        <qui-field-helper-text>Helper</qui-field-helper-text>
        <qui-field-error-text>Error</qui-field-error-text>
      </qui-field>,
    );

    await waitForChanges();

    expect(root.querySelector("[part=helper-text]")).toHaveAttribute("id", "field::helper-text");
    expect(root.querySelector("[part=error-text]")).toHaveAttribute("id", "field::error-text");
    expect(root.querySelector("[part=required-indicator]")).toHaveAttribute("data-required");
  });

  it("propagates disabled and read-only state to its control", async () => {
    const { root } = await render(
      <qui-field id="field" disabled readOnly>
        <qui-field-label>Label</qui-field-label>
        <qui-input />
      </qui-field>,
    );
    const input = queryInput(root);

    expect(root).toHaveAttribute("data-disabled");
    expect(root).toHaveAttribute("data-readonly");
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
  });
});
