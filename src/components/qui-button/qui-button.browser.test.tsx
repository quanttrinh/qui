import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn } from "../../test-utils/component";

describe("qui-button", () => {
  it("renders variant, size, and icon-only state", async () => {
    const { root } = await render(
      <qui-button variant="tonal" size="sm" iconOnly>
        +
      </qui-button>,
    );
    const button = queryPartIn<HTMLButtonElement>(root, "button");

    expect(button.type).toBe("button");
    expect(button).toHaveAttribute("data-variant", "tonal");
    expect(button).toHaveAttribute("data-size", "sm");
    expect(button).toHaveAttribute("data-icon-only");
  });

  it("renders an anchor when href is provided and removes it when disabled", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-button href="/target" target="_blank" rel="noreferrer">
        Link
      </qui-button>,
    );
    const anchor = queryPartIn<HTMLAnchorElement>(root, "button");

    expect(anchor.getAttribute("href")).toBe("/target");
    expect(anchor.target).toBe("_blank");
    expect(anchor.rel).toBe("noreferrer");

    await setProps({ disabled: true });
    await waitForChanges();
    expect(anchor.hasAttribute("href")).toBe(false);
    expect(anchor).toHaveAttribute("aria-disabled", "true");
    expect(anchor.tabIndex).toBe(-1);

    await setProps({ disabled: false });
    await waitForChanges();
    expect(anchor.getAttribute("href")).toBe("/target");
  });

  it("labels an icon-only button through the internal control", async () => {
    const { root } = await render(
      <qui-button iconOnly label="Add">
        +
      </qui-button>,
    );
    const button = queryPartIn<HTMLButtonElement>(root, "button");

    expect(button).toHaveAttribute("aria-label", "Add");
  });

  it("disables the native button", async () => {
    const { root } = await render(<qui-button disabled>Save</qui-button>);
    const button = queryPartIn<HTMLButtonElement>(root, "button");
    expect(button.disabled).toBe(true);
  });
});
