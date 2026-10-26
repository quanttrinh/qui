import { describe, expect, it, vi } from "vitest";

import { TabsController } from "./controller";

function createEnvironment(values: string[], activationMode: "manual" | "automatic" = "automatic") {
  const changes: (string | undefined)[] = [];
  let selected: string | undefined;
  let deselectable = false;
  const triggers = values.map((value) => ({
    id: `tabs:test:trigger-${value}`,
    dataset: { value },
    disabled: false,
    focus: vi.fn(),
  }));
  const controller = new TabsController({
    getValue: () => selected,
    getDefaultValue: () => undefined,
    getActivationMode: () => activationMode,
    getLoopFocus: () => true,
    getDeselectable: () => deselectable,
    onChange: (value) => {
      changes.push(value);
    },
    requestUpdate: () => undefined,
  });
  controller.hostWillLoad();
  for (const [index, value] of values.entries()) {
    const trigger = triggers[index];
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const button = trigger as unknown as HTMLButtonElement;
    controller.registerTrigger(value, button, button);
    controller.registerPanel(value, button);
  }
  return {
    controller,
    changes,
    triggers,
    setDeselectable: (value: boolean) => {
      deselectable = value;
    },
    setValue: (value: string | undefined) => {
      selected = value;
    },
  };
}

describe("TabsController", () => {
  it("selects and emits values", () => {
    const { controller, changes } = createEnvironment(["one", "two"]);
    controller.select("one");
    expect(controller.value).toBe("one");
    expect(controller.hasFocus).toBe(true);
    expect(changes).toEqual(["one"]);

    controller.select("two");
    expect(controller.value).toBe("two");
    expect(changes).toEqual(["one", "two"]);
  });

  it("keeps a controlled value while emitting the next value", () => {
    const { controller, changes, setValue } = createEnvironment(["one", "two"]);
    setValue("one");
    controller.select("two");
    expect(controller.value).toBe("one");
    expect(changes).toEqual(["two"]);
  });

  it("clears the value when deselecting the active tab", () => {
    const { controller, changes, setDeselectable } = createEnvironment(["one", "two"]);
    controller.select("one");
    setDeselectable(true);
    controller.select("one");
    expect(controller.value).toBeUndefined();
    expect(changes).toEqual(["one", undefined]);
  });

  it("tracks focus and blur", () => {
    const { controller } = createEnvironment(["one", "two"]);
    controller.focus("one");
    expect(controller.focusedValue).toBe("one");
    expect(controller.hasFocus).toBe(true);
    controller.blur();
    expect(controller.focusedValue).toBeUndefined();
    expect(controller.hasFocus).toBe(false);
  });

  it("moves and selects in automatic mode", () => {
    const { controller, triggers } = createEnvironment(["one", "two", "three"]);
    controller.focus("one");
    controller.move(1);
    expect(triggers[1].focus).toHaveBeenCalledOnce();
    expect(controller.value).toBe("two");

    controller.edge("last");
    expect(triggers[2].focus).toHaveBeenCalledOnce();
    expect(controller.value).toBe("three");
  });

  it("moves focus only in manual mode", () => {
    const { controller, changes, triggers } = createEnvironment(["one", "two"], "manual");
    controller.focus("one");
    controller.move(1);
    expect(triggers[1].focus).toHaveBeenCalledOnce();
    expect(controller.focusedValue).toBe("two");
    expect(changes).toEqual([]);
  });

  it("skips disabled triggers and preserves registration order", () => {
    const { controller, triggers } = createEnvironment(["one", "two", "three"]);
    const [, disabled] = triggers;
    disabled.disabled = true;
    controller.focus("one");
    controller.move(1);
    expect(triggers[2].focus).toHaveBeenCalledOnce();
    expect(disabled.focus).not.toHaveBeenCalled();
  });

  it("focuses the registered internal tab button", () => {
    const { controller, triggers } = createEnvironment(["one", "two"]);
    controller.focusTrigger("two");
    expect(triggers[1].focus).toHaveBeenCalledOnce();
  });

  it("registers list, trigger, and panel hosts", () => {
    const { controller, triggers } = createEnvironment(["one"]);
    const list = {} as HTMLElement;
    controller.registerList(list);
    expect(controller.getList()).toBe(list);
    expect(controller.getTrigger("one")?.trigger).toBe(triggers[0]);
    expect(controller.getPanel("one")).toBe(triggers[0]);
  });

  it("replaces a list registration and ignores its stale teardown", () => {
    const { controller } = createEnvironment(["one"]);
    const list = {} as HTMLElement;
    const replacement = {} as HTMLElement;
    const unregisterList = controller.registerList(list);
    controller.registerList(replacement);

    unregisterList();

    expect(controller.getList()).toBe(replacement);
  });

  it("preserves trigger registration order when an entry is replaced", () => {
    const { controller, triggers } = createEnvironment(["one", "two", "three"]);
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
    const { controller, triggers } = createEnvironment(["one", "two"]);
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
});
