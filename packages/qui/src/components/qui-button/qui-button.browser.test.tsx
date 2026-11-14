import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn } from "../../../tests/test-utils/component";

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

describe("qui-button theming", () => {
  it("overrides container and label colors per host", async () => {
    const { root, waitForChanges } = await render(<qui-button>Save</qui-button>);
    const button = queryPartIn<HTMLButtonElement>(root, "button");
    button.style.setProperty("transition", "none", "important");

    root.style.setProperty("--qui-button-container-color", "rgb(1, 2, 3)");
    root.style.setProperty("--qui-button-label-color", "rgb(4, 5, 6)");
    await waitForChanges();

    const computed = getComputedStyle(button);
    expect(computed.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(computed.color).toBe("rgb(4, 5, 6)");
  });

  it("applies the custom outline color to outlined buttons", async () => {
    const { root } = await render(<qui-button variant="outlined">Save</qui-button>);
    const button = queryPartIn<HTMLButtonElement>(root, "button");

    root.style.setProperty("--qui-button-outline-color", "rgb(7, 8, 9)");

    expect(getComputedStyle(button).borderTopColor).toBe("rgb(7, 8, 9)");
  });

  it("uses the custom state-layer color for the hover overlay", async () => {
    const { root } = await render(<qui-button>Save</qui-button>);
    const button = queryPartIn<HTMLButtonElement>(root, "button");

    root.style.setProperty("--qui-button-state-layer-color", "rgb(10, 11, 12)");

    expect(getComputedStyle(button, "::before").backgroundColor).toBe("rgb(10, 11, 12)");
  });
});
