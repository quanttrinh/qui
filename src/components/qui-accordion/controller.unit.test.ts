import { describe, expect, it, vi } from "vitest";

import { AccordionController } from "./controller";

function createEnvironment(options?: {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
}) {
  const changes: string[][] = [];
  let disabled = false;
  const triggers = ["one", "two", "three"].map((value) => ({
    id: `accordion:test:trigger-${value}`,
    focus: vi.fn(),
  }));
  const host = {
    querySelectorAll: () => triggers,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  } as unknown as HTMLElement;
  const controller = new AccordionController({
    getHost: () => host,
    getValue: () => undefined,
    getDefaultValue: () => options?.defaultValue,
    getMultiple: () => options?.multiple ?? false,
    getCollapsible: () => options?.collapsible ?? false,
    getTriggerId: (value) => `accordion:test:trigger-${value}`,
    onChange: (value) => {
      changes.push(value);
    },
    requestUpdate: () => {},
  });
  controller.hostWillLoad();
  return {
    controller,
    changes,
    triggers,
    disable: () => {
      disabled = true;
    },
    isDisabled: () => disabled,
  };
}

describe("AccordionController", () => {
  it("expands one item at a time", () => {
    const { controller, changes } = createEnvironment();
    controller.toggle("one");
    expect(controller.value).toEqual(["one"]);
    expect(changes).toEqual([["one"]]);

    controller.toggle("two");
    expect(controller.value).toEqual(["two"]);
    controller.toggle("two");
    expect(controller.value).toEqual(["two"]);
  });

  it("collapses when collapsible", () => {
    const { controller, changes } = createEnvironment({
      collapsible: true,
      defaultValue: ["one"],
    });
    controller.toggle("one");
    expect(controller.value).toEqual([]);
    expect(changes).toEqual([[]]);
  });

  it("adds and removes items when multiple", () => {
    const { controller } = createEnvironment({ multiple: true, defaultValue: ["one"] });
    controller.toggle("two");
    expect(controller.value).toEqual(["one", "two"]);
    controller.toggle("one");
    expect(controller.value).toEqual(["two"]);
  });

  it("tracks focus and keyboards movement without wrapping", () => {
    const { controller, triggers } = createEnvironment();
    controller.focus("one");
    expect(controller.focusedValue).toBe("one");
    controller.move("one", 1);
    expect(triggers[1]?.focus).toHaveBeenCalledOnce();
    controller.move("two", -1);
    expect(triggers[0]?.focus).toHaveBeenCalledOnce();
    controller.edge("last");
    expect(triggers[2]?.focus).toHaveBeenCalledOnce();
    controller.blur();
    expect(controller.focusedValue).toBeUndefined();
  });
});
