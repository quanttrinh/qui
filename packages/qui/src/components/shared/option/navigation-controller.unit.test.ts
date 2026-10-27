import { describe, expect, it } from "vitest";

import { OptionListNavigationController } from "./navigation-controller";
import { type OptionItem } from "./option";

const items: OptionItem[] = [
  { value: "one", label: "One", disabled: false },
  { value: "two", label: "Two", disabled: false },
  { value: "disabled", label: "Disabled", disabled: true },
  { value: "three", label: "Three", disabled: false },
];

function createController(options?: { looping?: boolean; initial?: string }) {
  const opened: { open: boolean; reason: string }[] = [];
  const revealed: number[] = [];
  let readOnly = false;
  const controller = new OptionListNavigationController<OptionItem>({
    getItems: () => items,
    getInitialActive: () => options?.initial,
    isDisabled: () => false,
    isReadOnly: () => readOnly,
    isLooping: () => options?.looping ?? true,
    onOpenChange: (open, reason) => {
      opened.push({ open, reason });
    },
    onReveal: (index) => {
      revealed.push(index);
    },
    requestUpdate: () => undefined,
  });
  return {
    controller,
    opened,
    revealed,
    setReadOnly: (value: boolean) => {
      readOnly = value;
    },
  };
}

describe("OptionListNavigationController", () => {
  it("opens with the initial active item and closes", () => {
    const { controller, opened } = createController({ initial: "two" });
    controller.openMenu("test");
    expect(controller.open).toBe(true);
    expect(controller.activeValue).toBe("two");
    expect(opened).toEqual([{ open: true, reason: "test" }]);

    controller.closeMenu("test");
    expect(controller.open).toBe(false);
    expect(controller.activeValue).toBeUndefined();
    expect(opened.at(-1)).toEqual({ open: false, reason: "test" });
  });

  it("does not open while read-only", () => {
    const { controller, setReadOnly } = createController();
    setReadOnly(true);
    controller.openMenu("test");
    expect(controller.open).toBe(false);
  });

  it("moves through enabled items and loops", () => {
    const { controller } = createController({ initial: "one" });
    controller.openMenu("test");
    controller.move(1);
    expect(controller.activeValue).toBe("two");
    controller.move(1);
    expect(controller.activeValue).toBe("three");
    controller.move(1);
    expect(controller.activeValue).toBe("one");
    controller.move(-1);
    expect(controller.activeValue).toBe("three");
  });

  it("stops at the ends without looping", () => {
    const { controller } = createController({ initial: "one", looping: false });
    controller.openMenu("test");
    controller.move(-1);
    expect(controller.activeValue).toBe("one");
    controller.edge("last");
    controller.move(1);
    expect(controller.activeValue).toBe("three");
  });

  it("selects the first and last enabled items", () => {
    const { controller } = createController();
    controller.edge("first");
    expect(controller.activeValue).toBe("one");
    controller.edge("last");
    expect(controller.activeValue).toBe("three");
  });

  it("finds the first enabled item with a prefix", () => {
    const { controller } = createController();
    expect(controller.findByPrefix("th")?.value).toBe("three");
    expect(controller.findByPrefix("dis")).toBeUndefined();
  });

  it("reveals a newly active item after render", () => {
    const { controller, revealed } = createController({ initial: "one" });
    controller.openMenu("test");
    controller.setActive("three");
    controller.hostDidRender();
    expect(revealed).toEqual([3]);

    controller.hostDidRender();
    expect(revealed).toEqual([3]);
  });
});
