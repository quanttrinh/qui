import { describe, expect, it } from "vitest";

import { type CheckedState } from "./checked-state";
import { CheckableController } from "./controller";

function createController(options?: {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  indeterminate?: boolean;
}) {
  const changes: CheckedState[] = [];
  let disabled = false;
  let readOnly = false;
  const controller = new CheckableController({
    getChecked: () => options?.checked,
    getDefaultChecked: () => options?.defaultChecked,
    getIndeterminate: () => options?.indeterminate ?? false,
    isDisabled: () => disabled,
    isReadOnly: () => readOnly,
    onChange: (checked) => {
      changes.push(checked);
    },
    requestUpdate: () => {},
  });
  controller.hostWillLoad();
  return {
    controller,
    changes,
    setDisabled: (value: boolean) => {
      disabled = value;
    },
    setReadOnly: (value: boolean) => {
      readOnly = value;
    },
  };
}

describe("CheckableController", () => {
  it("initializes from defaultChecked and toggles uncontrolled state", () => {
    const { controller, changes } = createController({ defaultChecked: false });
    expect(controller.isChecked).toBe(false);

    controller.toggle();
    expect(controller.isChecked).toBe(true);
    expect(controller.state).toBe("checked");
    expect(changes).toEqual([true]);

    controller.toggle();
    expect(controller.isChecked).toBe(false);
    expect(changes).toEqual([true, false]);
  });

  it("keeps the controlled value while emitting the next value", () => {
    const { controller, changes } = createController({ checked: true });
    expect(controller.isChecked).toBe(true);

    controller.toggle();
    expect(controller.isChecked).toBe(true);
    expect(changes).toEqual([false]);
  });

  it("treats indeterminate as checked next and false for form values", () => {
    const { controller, changes } = createController({ indeterminate: true });
    expect(controller.state).toBe("indeterminate");
    expect(controller.isIndeterminate).toBe(true);
    expect(controller.isChecked).toBe(false);

    controller.toggle();
    expect(changes).toEqual([true]);
    expect(controller.state).toBe("indeterminate");
  });

  it("ignores changes while disabled or read-only", () => {
    const { controller, changes, setDisabled, setReadOnly } = createController();
    setDisabled(true);
    controller.toggle();
    setDisabled(false);
    setReadOnly(true);
    controller.toggle();
    expect(changes).toEqual([]);
    expect(controller.isChecked).toBe(false);
  });

  it("resets and restores state", () => {
    const { controller } = createController({ defaultChecked: true });
    controller.toggle();
    expect(controller.isChecked).toBe(false);
    controller.reset();
    expect(controller.isChecked).toBe(true);
    controller.restore("indeterminate");
    expect(controller.state).toBe("indeterminate");
  });
});
