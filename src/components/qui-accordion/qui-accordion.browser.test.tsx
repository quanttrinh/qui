import { describe, expect, h, it, render } from "@stencil/vitest";

function triggers(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>("[part=trigger]")];
}

function contents(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[part=content]")];
}

describe("qui-accordion", () => {
  it("expands an item and emits the new values", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const spy = spyOnEvent("valuechange");

    triggers(root)[1].click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: ["two"] });
    expect(triggers(root)[1]).toHaveAttribute("aria-expanded", "true");
    expect(contents(root)[1].inert).toBe(false);

    triggers(root)[0].click();
    await waitForChanges();
    expect(triggers(root)[0]).toHaveAttribute("aria-expanded", "true");
    expect(triggers(root)[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps multiple items open", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion multiple defaultValue={["one"]}>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );

    triggers(root)[1].click();
    await waitForChanges();

    expect(triggers(root)[0]).toHaveAttribute("aria-expanded", "true");
    expect(triggers(root)[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses the active item when collapsible", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion collapsible defaultValue={["one"]}>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );

    triggers(root)[0].click();
    await waitForChanges();

    expect(triggers(root)[0]).toHaveAttribute("aria-expanded", "false");
    expect(contents(root)[0].inert).toBe(true);
  });

  it("moves focus with arrow, Home, and End keyboard navigation", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="three">
          <qui-accordion-trigger>Three</qui-accordion-trigger>
          <qui-accordion-content>Three content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const buttons = triggers(root);

    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[1]);

    buttons[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[2]);

    buttons[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[0]);
  });
});
