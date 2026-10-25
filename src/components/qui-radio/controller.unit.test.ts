import { describe, expect, it } from "vitest";

import { RadioGroupController } from "./controller";

function createController(options?: { value?: string; defaultValue?: string }) {
  const changes: (string | undefined)[] = [];
  let disabled = false;
  let readOnly = false;
  let value = options?.value;
  const controller = new RadioGroupController({
    getValue: () => value,
    getDefaultValue: () => options?.defaultValue,
    isDisabled: () => disabled,
    isReadOnly: () => readOnly,
    onChange: (next) => {
      changes.push(next);
    },
    requestUpdate: () => {},
  });
  controller.hostWillLoad();
  return {
    controller,
    changes,
    setValue: (next: string | undefined) => {
      value = next;
    },
    setDisabled: (next: boolean) => {
      disabled = next;
    },
    setReadOnly: (next: boolean) => {
      readOnly = next;
    },
  };
}

describe("RadioGroupController", () => {
  it("selects an uncontrolled value and emits it", () => {
    const { controller, changes } = createController({ defaultValue: "one" });
    expect(controller.value).toBe("one");
    controller.select("two");
    expect(controller.value).toBe("two");
    expect(changes).toEqual(["two"]);
  });

  it("keeps a controlled value while emitting the next value", () => {
    const { controller, changes } = createController({ value: "one" });
    controller.select("two");
    expect(controller.value).toBe("one");
    expect(changes).toEqual(["two"]);
  });

  it("ignores disabled and read-only groups", () => {
    const { controller, changes, setDisabled, setReadOnly } = createController({
      defaultValue: "one",
    });
    setDisabled(true);
    controller.select("two");
    setDisabled(false);
    setReadOnly(true);
    controller.select("two");
    expect(controller.value).toBe("one");
    expect(changes).toEqual([]);
  });

  it("tracks focus and blur", () => {
    const { controller } = createController();
    controller.focus("one", true);
    expect(controller.focusedValue).toBe("one");
    expect(controller.focusVisibleValue).toBe("one");
    controller.blur();
    expect(controller.focusedValue).toBeUndefined();
    expect(controller.focusVisibleValue).toBeUndefined();
  });

  it("resets and restores values", () => {
    const { controller } = createController({ defaultValue: "one" });
    controller.select("two");
    controller.reset();
    expect(controller.value).toBe("one");
    controller.restore("three");
    expect(controller.value).toBe("three");
    expect(controller.initialValue).toBe("one");
  });
});
