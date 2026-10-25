import { describe, expect, h, it, render } from "@stencil/vitest";

function queryDialog(root: HTMLElement): HTMLDialogElement {
  const dialog = root.querySelector("dialog");
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new TypeError("Expected a native dialog");
  }
  return dialog;
}

describe("qui-dialog", () => {
  it("opens modally from its trigger and closes from its close button", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-dialog>
        <qui-dialog-trigger>Open</qui-dialog-trigger>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
          <qui-dialog-description>Description</qui-dialog-description>
          <qui-dialog-actions>
            <qui-dialog-close>Close</qui-dialog-close>
          </qui-dialog-actions>
        </qui-dialog-content>
      </qui-dialog>,
    );
    const spy = spyOnEvent("openchange");
    const dialog = queryDialog(root);
    const trigger = root.querySelector<HTMLButtonElement>("[part=trigger]");
    const close = root.querySelector<HTMLButtonElement>("[part=close]");
    if (trigger === null || close === null) {
      throw new TypeError("Expected dialog controls");
    }

    trigger.click();
    await waitForChanges();

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-labelledby")).not.toBeNull();
    expect(dialog.getAttribute("aria-describedby")).not.toBeNull();
    expect(spy.firstEvent?.detail).toEqual({ open: true, returnValue: "" });
    expect(Object.hasOwn(document.documentElement.dataset, "quiScrollLocked")).toBe(true);

    close.click();
    await waitForChanges();

    expect(dialog.open).toBe(false);
    expect(spy.lastEvent?.detail).toEqual({ open: false, returnValue: "" });
    expect(Object.hasOwn(document.documentElement.dataset, "quiScrollLocked")).toBe(false);
  });

  it("opens and closes from the open prop", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-dialog>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );
    const dialog = queryDialog(root);

    await setProps({ open: true });
    await waitForChanges();
    expect(dialog.open).toBe(true);

    await setProps({ open: false });
    await waitForChanges();
    expect(dialog.open).toBe(false);
  });
});
