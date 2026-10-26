import { describe, expect, it, vi } from "vitest";

import { AccordionController } from "./controller";

function createEnvironment(options?: {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
}) {
  const changes: string[][] = [];
  const triggers = ["one", "two", "three"].map((value) => ({
    id: `accordion:test:trigger-${value}`,
    disabled: false,
    focus: vi.fn(),
  }));
  const controller = new AccordionController({
    getValue: () => undefined,
    getDefaultValue: () => options?.defaultValue,
    getMultiple: () => options?.multiple ?? false,
    getCollapsible: () => options?.collapsible ?? false,
    onChange: (value) => {
      changes.push(value);
    },
    requestUpdate: () => undefined,
  });
  controller.hostWillLoad();
  for (const [index, value] of ["one", "two", "three"].entries()) {
    const trigger = triggers[index];
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const button = trigger as unknown as HTMLButtonElement;
    controller.registerTrigger(value, button, button);
  }
  return {
    controller,
    changes,
    triggers,
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
    expect(triggers[1].focus).toHaveBeenCalledOnce();
    controller.move("two", -1);
    expect(triggers[0].focus).toHaveBeenCalledOnce();
    controller.edge("last");
    expect(triggers[2].focus).toHaveBeenCalledOnce();
    controller.blur();
    expect(controller.focusedValue).toBeUndefined();
  });

  it("skips disabled triggers during navigation", () => {
    const { controller, triggers } = createEnvironment();
    const [, disabled] = triggers;
    disabled.disabled = true;
    controller.focus("one");
    controller.move("one", 1);
    expect(triggers[2].focus).toHaveBeenCalledOnce();
    expect(disabled.focus).not.toHaveBeenCalled();
  });

  it("focuses the registered internal trigger button", () => {
    const { controller, triggers } = createEnvironment();
    controller.focusTrigger("two");
    expect(triggers[1].focus).toHaveBeenCalledOnce();
  });

  it("preserves registration order when a trigger is replaced", () => {
    const { controller, triggers } = createEnvironment();
    const replacement = {
      disabled: false,
      focus: vi.fn(),
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const button = replacement as unknown as HTMLButtonElement;
    controller.registerTrigger("one", button, button);

    controller.edge("first");
    expect(replacement.focus).toHaveBeenCalledOnce();
    expect(triggers[0].focus).not.toHaveBeenCalled();

    controller.edge("last");
    expect(triggers[2].focus).toHaveBeenCalledOnce();
  });

  it("ignores stale teardown after a trigger is replaced", () => {
    const { controller, triggers } = createEnvironment();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const first = triggers[0] as unknown as HTMLButtonElement;
    const unregisterFirst = controller.registerTrigger("one", first, first);
    const replacement = {
      disabled: false,
      focus: vi.fn(),
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const replacementButton = replacement as unknown as HTMLButtonElement;
    controller.registerTrigger("one", replacementButton, replacementButton);

    unregisterFirst();
    unregisterFirst();

    expect(controller.getTrigger("one")?.trigger).toBe(replacementButton);
  });

  it("tracks content hosts by value", () => {
    const { controller } = createEnvironment();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const first = { id: "first" } as HTMLElement;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const second = { id: "second" } as HTMLElement;
    const unregisterFirst = controller.registerContent("one", first);
    controller.registerContent("two", second);

    unregisterFirst();
    expect(controller.getContent("one")).toBeUndefined();
    expect(controller.getContent("two")).toBe(second);
  });
});
