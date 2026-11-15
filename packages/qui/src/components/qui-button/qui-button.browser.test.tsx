import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveHost } from "../../../tests/test-utils/component";

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

describe("qui-button form integration", () => {
  it("submits the surrounding form", async () => {
    let submissions = 0;
    const { root, waitForChanges } = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submissions += 1;
        }}
      >
        <qui-button type="submit">Save</qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(submissions).toBe(1);
  });

  it("does not submit when disabled", async () => {
    let submissions = 0;
    const { root, waitForChanges } = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submissions += 1;
        }}
      >
        <qui-button type="submit" disabled>
          Save
        </qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(submissions).toBe(0);
  });

  it("lets a click handler cancel reset", async () => {
    let resets = 0;
    const { root, waitForChanges } = await render(
      <form
        onReset={() => {
          resets += 1;
        }}
      >
        <qui-button
          type="reset"
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          Reset
        </qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(resets).toBe(0);
  });

  it("lets a click handler cancel submission", async () => {
    let submissions = 0;
    const { root, waitForChanges } = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submissions += 1;
        }}
      >
        <qui-button
          type="submit"
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          Save
        </qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(submissions).toBe(0);
  });

  it("resets the surrounding form", async () => {
    let resets = 0;
    const { root, waitForChanges } = await render(
      <form
        onReset={() => {
          resets += 1;
        }}
      >
        <qui-button type="reset">Reset</qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(resets).toBe(1);
  });
});

describe("qui-button form association", () => {
  it("is a no-op without a form owner", async () => {
    const { root, waitForChanges } = await render(
      <div>
        <qui-button type="submit">Save</qui-button>
      </div>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    expect(() => {
      button.click();
    }).not.toThrow();
    await waitForChanges();
  });

  it("uses the form attribute with native precedence", async () => {
    let targetSubmissions = 0;
    let outerSubmissions = 0;
    const { root, waitForChanges } = await render(
      <div>
        <form
          id="target-form"
          onSubmit={(event) => {
            event.preventDefault();
            targetSubmissions += 1;
          }}
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            outerSubmissions += 1;
          }}
        >
          <qui-button form="target-form" type="submit">
            Save
          </qui-button>
        </form>
      </div>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    button.click();
    await waitForChanges();

    expect(targetSubmissions).toBe(1);
    expect(outerSubmissions).toBe(0);
  });

  it("ignores an empty form attribute", async () => {
    let submissions = 0;
    const { root, waitForChanges } = await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submissions += 1;
        }}
      >
        <qui-button form="" type="submit">
          Save
        </qui-button>
      </form>,
    );
    const host = resolveHost<HTMLQuiButtonElement>(root, "qui-button");
    const button = queryPartIn<HTMLButtonElement>(host, "button");

    expect(() => {
      button.click();
    }).not.toThrow();
    await waitForChanges();

    expect(submissions).toBe(0);
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
