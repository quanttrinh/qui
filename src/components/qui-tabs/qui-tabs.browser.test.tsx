import { describe, expect, h, it, render } from "@stencil/vitest";

function triggers(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>("[part=trigger]")];
}

function panels(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[part=panel]")];
}

describe("qui-tabs", () => {
  it("selects a tab and shows the matching panel", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
      </qui-tabs>,
    );
    const spy = spyOnEvent("valuechange");

    triggers(root)[1].click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "two" });
    expect(triggers(root)[1]).toHaveAttribute("aria-selected", "true");
    expect(panels(root)[0].hidden).toBe(true);
    expect(panels(root)[1].hidden).toBe(false);
  });

  it("keeps a controlled value while emitting the next value", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-tabs value="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
      </qui-tabs>,
    );
    const spy = spyOnEvent("valuechange");

    triggers(root)[1].click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "two" });
    expect(triggers(root)[0]).toHaveAttribute("aria-selected", "true");

    await setProps({ value: "two" });
    expect(triggers(root)[1]).toHaveAttribute("aria-selected", "true");
    expect(panels(root)[1].hidden).toBe(false);
  });

  it("navigates with arrow, Home, and End keys", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
          <qui-tab-trigger value="three">Three</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
        <qui-tab-panel value="three">Three panel</qui-tab-panel>
      </qui-tabs>,
    );
    const buttons = triggers(root);

    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-selected", "true");

    buttons[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]).toHaveAttribute("aria-selected", "true");

    buttons[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0]).toHaveAttribute("aria-selected", "true");
  });
});
