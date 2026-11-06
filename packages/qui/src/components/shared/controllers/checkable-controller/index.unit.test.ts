import { describe, expect, it } from "vitest";

import { createTestControllerHost } from "../../../../../tests/test-utils/controller-host";
import { CheckableController, type CheckedState } from "./index";

function createController(options?: {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  indeterminate?: boolean;
  supportsIndeterminate?: boolean;
}) {
  const changes: CheckedState[] = [];
  let disabled = false;
  let readOnly = false;
  const controller = new CheckableController(createTestControllerHost(), {
    getChecked: () => options?.checked,
    getDefaultChecked: () => options?.defaultChecked,
    getIndeterminate: () => options?.indeterminate ?? false,
    supportsIndeterminate: options?.supportsIndeterminate,
    isDisabled: () => disabled,
    isReadOnly: () => readOnly,
    onChange: (checked) => {
      changes.push(checked);
    },
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

  it("normalizes attribute-style values", () => {
    const { controller } = createController();

    expect(controller.normalize("")).toBe(true);
    expect(controller.normalize("true")).toBe(true);
    expect(controller.normalize(true)).toBe(true);
    expect(controller.normalize("false")).toBe(false);
    expect(controller.normalize(false)).toBe(false);
    expect(controller.normalize("indeterminate")).toBe("indeterminate");
    expect(controller.normalize("other")).toBeUndefined();
  });

  it("rejects indeterminate when the control does not support it", () => {
    const { controller } = createController({ supportsIndeterminate: false });

    expect(controller.normalize("indeterminate")).toBeUndefined();
    expect(controller.normalize("true")).toBe(true);
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
