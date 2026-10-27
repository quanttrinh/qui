import { describe, expect, it, vi } from "vitest";

import { createReflectionElement, fakeTarget } from "../../test-utils/fake-aria";
import { applyDialogAria, createDialogHostRegistry } from "./dialog-aria";

function createDialog(supported: boolean) {
  return createReflectionElement(supported, ["ariaDescribedByElements", "ariaLabelledByElements"]);
}

describe("dialog host registry", () => {
  it("registers the title and description hosts", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = createDialogHostRegistry(onChange);
    const title = fakeTarget("title");
    const description = fakeTarget("description");

    registry.registerTitle(title);
    registry.registerDescription(description);

    expect(registry.titleHost()).toBe(title);
    expect(registry.descriptionHost()).toBe(description);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("clears each host on unregister", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = createDialogHostRegistry(onChange);
    const unregisterTitle = registry.registerTitle(fakeTarget("title"));
    const unregisterDescription = registry.registerDescription(fakeTarget("description"));

    unregisterTitle();
    expect(registry.titleHost()).toBeUndefined();
    expect(registry.descriptionHost()).not.toBeUndefined();

    unregisterDescription();
    expect(registry.descriptionHost()).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("ignores a stale unregister after a replacement host", () => {
    const registry = createDialogHostRegistry(() => undefined);
    const first = fakeTarget("first");
    const second = fakeTarget("second");
    const unregisterFirst = registry.registerTitle(first);

    registry.registerTitle(second);
    unregisterFirst();

    expect(registry.titleHost()).toBe(second);
  });

  it("does not notify when the same host registers twice", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = createDialogHostRegistry(onChange);
    const title = fakeTarget("title");

    registry.registerTitle(title);
    registry.registerTitle(title);

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("clears both hosts at once", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = createDialogHostRegistry(onChange);
    registry.registerTitle(fakeTarget("title"));
    registry.registerDescription(fakeTarget("description"));
    onChange.mockClear();

    registry.clear();

    expect(registry.titleHost()).toBeUndefined();
    expect(registry.descriptionHost()).toBeUndefined();
    expect(onChange).toHaveBeenCalledOnce();
  });
});

describe("dialog ARIA wiring", () => {
  it("targets the registered hosts with element reflection", () => {
    const dialog = createDialog(true);
    const title = fakeTarget("title");
    const description = fakeTarget("description");

    applyDialogAria(dialog, {
      titleHost: () => title,
      descriptionHost: () => description,
    });

    expect(dialog.ariaLabelledByElements).toEqual([title]);
    expect(dialog.ariaDescribedByElements).toEqual([description]);
    expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
    expect(dialog.hasAttribute("aria-describedby")).toBe(false);
  });

  it("clears relationships when the title and description are absent", () => {
    const dialog = createDialog(true);
    dialog.setAttribute("aria-labelledby", "stale");
    dialog.setAttribute("aria-describedby", "stale");

    applyDialogAria(dialog, {
      titleHost: () => undefined,
      descriptionHost: () => undefined,
    });

    expect(dialog.ariaLabelledByElements).toEqual([]);
    expect(dialog.ariaDescribedByElements).toEqual([]);
    expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
    expect(dialog.hasAttribute("aria-describedby")).toBe(false);
  });

  it("falls back to host IDREFs when reflection is unsupported", () => {
    const dialog = createDialog(false);

    applyDialogAria(dialog, {
      titleHost: () => fakeTarget("dialog-title"),
      descriptionHost: () => fakeTarget("dialog-description"),
    });

    expect(dialog.getAttribute("aria-labelledby")).toBe("dialog-title");
    expect(dialog.getAttribute("aria-describedby")).toBe("dialog-description");
  });

  it("removes IDREFs for missing hosts in the fallback path", () => {
    const dialog = createDialog(false);
    dialog.setAttribute("aria-labelledby", "stale");
    dialog.setAttribute("aria-describedby", "stale");

    applyDialogAria(dialog, {
      titleHost: () => undefined,
      descriptionHost: () => undefined,
    });

    expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
    expect(dialog.hasAttribute("aria-describedby")).toBe(false);
  });
});
