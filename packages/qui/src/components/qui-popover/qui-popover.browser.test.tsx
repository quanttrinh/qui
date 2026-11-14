import { describe, expect, getComponentSpies, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveHost } from "../../../tests/test-utils/component";
import { settle } from "../../../tests/test-utils/dom-ready";

describe("qui-popover", () => {
  it("shows next to its sibling anchor and dismisses on Escape", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover>Popover content</qui-popover>
      </div>,
    );
    const popover = resolveHost<HTMLQuiPopoverElement>(root, "qui-popover");
    const panel = queryPartIn(popover, "content");
    const spy = spyOnEvent("dismiss");

    popover.open = true;
    await waitForChanges();
    await settle(30);

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

  it("accepts an explicit anchor element", async () => {
    const { root, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <section>
          <qui-popover>Popover content</qui-popover>
        </section>
      </div>,
    );
    const anchor = root.querySelector("button");
    const popover = resolveHost<HTMLQuiPopoverElement>(root, "qui-popover");
    const panel = queryPartIn(popover, "content");
    if (!(anchor instanceof HTMLButtonElement)) {
      throw new TypeError("Expected a button anchor");
    }

    popover.anchor = anchor;
    popover.open = true;
    await waitForChanges();
    await settle(30);

    expect(panel.matches(":popover-open")).toBe(true);
    expect(panel.style.top).not.toBe("");
    expect(panel.style.left).not.toBe("");
  });

  it("dismisses when the pointer goes outside", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover>Popover content</qui-popover>
      </div>,
    );
    const popover = resolveHost<HTMLQuiPopoverElement>(root, "qui-popover");
    const spy = spyOnEvent("dismiss");

    popover.open = true;
    await waitForChanges();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await waitForChanges();

    expect(spy.lastEvent?.detail).toEqual({ reason: "outside" });
  });
});

describe("qui-popover render scoping", () => {
  it("skips the root when a positioning prop changes", async () => {
    const { root, waitForChanges } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover>Popover content</qui-popover>
      </div>,
      {
        spyOn: {
          components: {
            "qui-popover": { lifecycle: ["render"] },
          },
        },
      },
    );
    const popover = resolveHost<HTMLQuiPopoverElement>(root, "qui-popover");
    const renders = (): number =>
      getComponentSpies(popover)?.lifecycle.render?.mock.calls.length ?? 0;
    const baseline = renders();

    popover.placement = "top-start";
    popover.offset = 12;
    popover.sameWidth = true;
    await waitForChanges();

    expect(renders()).toBe(baseline);
  });
});

describe("qui-popover colors", () => {
  it("applies surface and border color custom properties", async () => {
    const { root } = await render(
      <div>
        <button type="button">Anchor</button>
        <qui-popover open>Popover content</qui-popover>
      </div>,
    );
    const popover = resolveHost<HTMLQuiPopoverElement>(root, "qui-popover");
    const panel = queryPartIn(popover, "content");

    popover.style.setProperty("--qui-popover-surface-color", "rgb(1, 2, 3)");
    popover.style.setProperty("--qui-popover-border-color", "rgb(4, 5, 6)");

    expect(getComputedStyle(panel).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(panel).borderTopColor).toBe("rgb(4, 5, 6)");
  });
});
