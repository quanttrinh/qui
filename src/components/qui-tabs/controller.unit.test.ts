import { describe, expect, it, vi } from "vitest";

import { TabsController } from "./controller";

function createEnvironment(values: string[], activationMode: "manual" | "automatic" = "automatic") {
  const changes: (string | undefined)[] = [];
  let selected: string | undefined;
  let deselectable = false;
  const triggers = values.map((value) => ({
    id: `tabs:test:trigger-${value}`,
    dataset: { value },
    focus: vi.fn(),
  }));
  const host = {
    querySelectorAll: () => triggers,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  } as unknown as HTMLElement;
  const controller = new TabsController({
    getHost: () => host,
    getValue: () => selected,
    getDefaultValue: () => undefined,
    getActivationMode: () => activationMode,
    getLoopFocus: () => true,
    getDeselectable: () => deselectable,
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
    expect(triggers[1]?.focus).toHaveBeenCalledOnce();
    expect(controller.value).toBe("two");

    controller.edge("last");
    expect(triggers[2]?.focus).toHaveBeenCalledOnce();
    expect(controller.value).toBe("three");
  });

  it("moves focus only in manual mode", () => {
    const { controller, changes, triggers } = createEnvironment(["one", "two"], "manual");
    controller.focus("one");
    controller.move(1);
    expect(triggers[1]?.focus).toHaveBeenCalledOnce();
    expect(controller.focusedValue).toBe("two");
    expect(changes).toEqual([]);
  });
});
