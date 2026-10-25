import { describe, expect, it } from "vitest";

import { type OptionItem } from "./option";
import { OptionSelectionController } from "./selection-controller";

const items: OptionItem[] = [
  { value: "one", label: "One", disabled: false },
  { value: "two", label: "Two", disabled: false },
  { value: "disabled", label: "Disabled", disabled: true },
];

function createController(options?: {
  value?: string[];
  defaultValue?: string[];
  multiple?: boolean;
  deselectable?: boolean;
  readOnly?: boolean;
}) {
  const changes: { value: string[]; items: OptionItem[] }[] = [];
  let readOnly = options?.readOnly ?? false;
  const controller = new OptionSelectionController({
    getValue: () => options?.value,
    getDefaultValue: () => options?.defaultValue,
    getItems: () => items,
    getMultiple: () => options?.multiple ?? false,
    getDeselectable: () => options?.deselectable ?? false,
    isReadOnly: () => readOnly,
    onChange: (details) => {
      changes.push(details);
    },
    requestUpdate: () => {},
  });
  controller.hostWillLoad();
  return {
    controller,
    changes,
    setReadOnly: (value: boolean) => {
      readOnly = value;
    },
  };
}

describe("OptionSelectionController", () => {
  it("selects a single item and emits its data", () => {
    const { controller, changes } = createController({ defaultValue: ["one"] });
    expect(controller.selected).toEqual(["one"]);

    const item = controller.select("two");
    expect(item?.value).toBe("two");
    expect(controller.selected).toEqual(["two"]);
    expect(changes.at(-1)?.items.map((entry) => entry.value)).toEqual(["two"]);
  });

  it("toggles values when multiple", () => {
    const { controller } = createController({ multiple: true, defaultValue: ["one"] });
    controller.select("two");
    expect(controller.selected).toEqual(["one", "two"]);
    controller.select("one");
    expect(controller.selected).toEqual(["two"]);
  });

  it("ignores disabled items and read-only selection", () => {
    const { controller, changes, setReadOnly } = createController({ defaultValue: ["one"] });
    expect(controller.select("disabled")).toBeUndefined();
    setReadOnly(true);
    expect(controller.select("two")).toBeUndefined();
    expect(controller.selected).toEqual(["one"]);
    expect(changes).toEqual([]);
  });

  it("clears the value when deselectable", () => {
    const { controller } = createController({ defaultValue: ["one"], deselectable: true });
    controller.select("one");
    expect(controller.selected).toEqual([]);
  });

  it("keeps a controlled value while emitting the next value", () => {
    const { controller, changes } = createController({ value: ["one"] });
    controller.select("two");
    expect(controller.selected).toEqual(["one"]);
    expect(changes.at(-1)?.value).toEqual(["two"]);
  });

  it("resets and restores values", () => {
    const { controller } = createController({ defaultValue: ["one"] });
    controller.select("two");
    controller.reset();
    expect(controller.selected).toEqual(["one"]);
    controller.restore(["two"]);
    expect(controller.selected).toEqual(["two"]);
  });
});
