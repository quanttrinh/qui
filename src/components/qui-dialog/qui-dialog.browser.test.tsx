import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectAriaElements } from "../../test-utils/aria";
import { queryHost, queryPartIn } from "../../test-utils/component";
import { shadowOf } from "../../test-utils/shadow";

function queryDialog(root: HTMLElement): HTMLDialogElement {
  return queryPartIn<HTMLDialogElement>(queryHost(root, "qui-dialog-content"), "dialog");
}

function queryControls(root: HTMLElement): {
  trigger: HTMLButtonElement;
  close: HTMLButtonElement;
} {
  const trigger = queryPartIn<HTMLButtonElement>(queryHost(root, "qui-dialog-trigger"), "trigger");
  const close = queryPartIn<HTMLButtonElement>(queryHost(root, "qui-dialog-close"), "close");
  return { trigger, close };
}

interface DialogParts {
  dialog: HTMLDialogElement;
  contentHost: HTMLElement;
  titleHost: HTMLElement;
  descriptionHost: HTMLElement;
  trigger: HTMLButtonElement;
  close: HTMLButtonElement;
}

function queryParts(root: HTMLElement): DialogParts {
  return {
    dialog: queryDialog(root),
    contentHost: queryHost(root, "qui-dialog-content"),
    titleHost: queryHost(root, "qui-dialog-title"),
    descriptionHost: queryHost(root, "qui-dialog-description"),
    ...queryControls(root),
  };
}

function expectScrollLocked(locked: boolean): void {
  expect(Object.hasOwn(document.documentElement.dataset, "quiScrollLocked")).toBe(locked);
}

function expectContentWiring({
  contentHost,
  dialog,
  titleHost,
  descriptionHost,
}: Pick<DialogParts, "contentHost" | "dialog" | "titleHost" | "descriptionHost">): void {
  expect(shadowOf(contentHost).contains(dialog)).toBe(true);
  expect(titleHost).toHaveTextContent("Title");
  expect(descriptionHost).toHaveTextContent("Description");
  expect(titleHost.id).not.toBe("");
  expect(descriptionHost.id).not.toBe("");
  expect(queryPartIn(titleHost, "title")).toHaveAttribute("part", "title");
  expect(queryPartIn(descriptionHost, "description")).toHaveAttribute("part", "description");
}

function expectDialogAria(
  dialog: HTMLDialogElement,
  titleHost: HTMLElement,
  descriptionHost: HTMLElement,
): void {
  expectAriaElements(dialog, {
    ariaLabelledByElements: [titleHost],
    ariaDescribedByElements: [descriptionHost],
  });
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

    await waitForChanges();

    const spy = spyOnEvent("openchange");
    const { dialog, contentHost, titleHost, descriptionHost, trigger, close } = queryParts(root);

    expectContentWiring({ contentHost, dialog, titleHost, descriptionHost });

    trigger.click();
    await waitForChanges();

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("role")).toBe("dialog");
    expectDialogAria(dialog, titleHost, descriptionHost);
    expect(spy.firstEvent?.detail).toEqual({ open: true, returnValue: "" });
    expectScrollLocked(true);

    close.click();
    await waitForChanges();

    expect(dialog.open).toBe(false);
    expect(spy.lastEvent?.detail).toEqual({ open: false, returnValue: "" });
    expectScrollLocked(false);
  });

  it("opens and closes from the open prop", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-dialog>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();

    const dialog = queryDialog(root);

    await setProps({ open: true });
    await waitForChanges();
    expect(dialog.open).toBe(true);
    expectScrollLocked(true);

    await setProps({ open: false });
    await waitForChanges();
    expect(dialog.open).toBe(false);
    expectScrollLocked(false);
  });

  it("reopens when modality changes while open", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-dialog open>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();
    const dialog = queryDialog(root);

    expect(dialog.matches(":modal")).toBe(true);
    expectScrollLocked(true);

    await setProps({ modal: false });
    await waitForChanges();

    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(false);
    expectScrollLocked(false);
  });

  it("switches from non-modal to modal without closing", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-dialog open modal={false}>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();
    const spy = spyOnEvent("openchange");
    const dialog = queryDialog(root);
    const dialogHost = root as unknown as { isDialogOpen: () => Promise<boolean> };

    expect(dialog.matches(":modal")).toBe(false);
    expectScrollLocked(false);
    expect(await dialogHost.isDialogOpen()).toBe(true);

    await setProps({ modal: true });
    await waitForChanges();

    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(true);
    expect(await dialogHost.isDialogOpen()).toBe(true);
    expectScrollLocked(true);
    expect(spy).toHaveReceivedEventTimes(0);
  });

  it("clears title ARIA when the title is removed", async () => {
    const { root, waitForChanges } = await render(
      <qui-dialog open>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();
    const dialog = queryDialog(root);
    const titleHost = queryHost(root, "qui-dialog-title");
    expectAriaElements(dialog, { ariaLabelledByElements: [titleHost] });

    titleHost.remove();
    await waitForChanges();

    expectAriaElements(dialog, { ariaLabelledByElements: [] });
  });

  it("closes on an outside pointer press and stays open for inside presses", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-dialog modal={false}>
        <qui-dialog-trigger>Open</qui-dialog-trigger>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();

    const dialog = queryDialog(root);

    await setProps({ open: true });
    await waitForChanges();
    expect(dialog.open).toBe(true);

    dialog.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await waitForChanges();
    expect(dialog.open).toBe(true);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await waitForChanges();
    expect(dialog.open).toBe(false);
  });

  it("emits dialogcancel when the native dialog is cancelled", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-dialog modal={false} open>
        <qui-dialog-content>
          <qui-dialog-title>Title</qui-dialog-title>
        </qui-dialog-content>
      </qui-dialog>,
    );

    await waitForChanges();

    const spy = spyOnEvent("dialogcancel");
    const dialog = queryDialog(root);

    dialog.dispatchEvent(new Event("cancel", { bubbles: true, composed: true }));
    await waitForChanges();

    expect(spy).toHaveReceivedEvent();
  });
});
