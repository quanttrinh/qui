import { describe, expect, h, it, render } from "@stencil/vitest";

describe("qui-popover", () => {
  it("shows next to its sibling anchor and dismisses on Escape", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover>Popover content</qui-popover>
      </div>,
    );
    const popover = root.querySelector<HTMLQuiPopoverElement>("qui-popover");
    const panel = root.querySelector<HTMLElement>("[part=content]");
    if (popover === null || panel === null) {
      throw new TypeError("Expected a popover");
    }
    const spy = spyOnEvent("dismiss");

    popover.open = true;
    await waitForChanges();
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 30);
    });

    expect(panel.matches(":popover-open")).toBe(true);
    expect(panel.style.top).not.toBe("");
    expect(panel.style.left).not.toBe("");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    await waitForChanges();

    expect(spy.lastEvent?.detail).toEqual({ reason: "escape" });

    popover.open = false;
    await waitForChanges();
    expect(panel.matches(":popover-open")).toBe(false);
  });

  it("dismisses when the pointer goes outside", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover>Popover content</qui-popover>
      </div>,
    );
    const popover = root.querySelector<HTMLQuiPopoverElement>("qui-popover");
    if (popover === null) {
      throw new TypeError("Expected a popover");
    }
    const spy = spyOnEvent("dismiss");

    popover.open = true;
    await waitForChanges();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await waitForChanges();

    expect(spy.lastEvent?.detail).toEqual({ reason: "outside" });
  });
});
