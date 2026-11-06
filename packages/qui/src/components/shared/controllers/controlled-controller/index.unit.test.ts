import { describe, expect, it } from "vitest";

import { createTestControllerHost } from "../../../../../tests/test-utils/controller-host";
import { ControlledControllerBase } from "./index";

class TestControlledController<TValue> extends ControlledControllerBase<TValue> {
  commitValue(value: TValue): void {
    this.commit(value);
  }
}

function createController(options?: { value?: string; defaultValue?: string; fallback?: string }) {
  const changes: string[] = [];
  const host = createTestControllerHost();
  const controller = new TestControlledController<string>(host, {
    getValue: () => options?.value,
    getDefaultValue: () => options?.defaultValue,
    getFallback: () => options?.fallback ?? "",
    onChange: (value) => {
      changes.push(value);
    },
  });
  return {
    controller,
    changes,
    host,
  };
}

describe("ControlledControllerBase", () => {
  it("initializes from the default value when uncontrolled", () => {
    const { controller } = createController({ defaultValue: "default" });

    controller.hostWillLoad();

    expect(controller.value).toBe("default");
    expect(controller.initialValue).toBe("default");
  });

  it("prefers the controlled value while keeping uncontrolled state separate", () => {
    const { controller, changes } = createController({
      value: "controlled",
      defaultValue: "default",
    });
    controller.hostWillLoad();

    controller.restore("next");

    expect(controller.value).toBe("controlled");
    expect(changes).toEqual([]);
  });

  it("commits through the subclass without an external wrapper", () => {
    const { controller, changes } = createController({ defaultValue: "default" });
    controller.hostWillLoad();

    controller.commitValue("next");

    expect(controller.value).toBe("next");
    expect(changes).toEqual(["next"]);
  });

  it("resets to the initialization snapshot without notifying", () => {
    const { controller, changes } = createController({ defaultValue: "default" });
    controller.hostWillLoad();
    controller.commitValue("next");

    controller.reset();

    expect(controller.value).toBe("default");
    expect(changes).toEqual(["next"]);
  });

  it("restores an external value without notifying", () => {
    const environment = createController({ defaultValue: "default" });
    const { controller, changes } = environment;
    controller.hostWillLoad();

    controller.restore("restored");

    expect(controller.value).toBe("restored");
    expect(changes).toEqual([]);
    expect(environment.host.updateCount).toBe(1);
  });

  it("clones values before storing them", () => {
    const values: string[][] = [];
    const controller = new TestControlledController<string[]>(createTestControllerHost(), {
      getValue: () => undefined,
      getDefaultValue: () => ["one"],
      getFallback: () => [],
      onChange: (value) => {
        values.push(value);
      },
      copy: (value) => [...value],
    });
    controller.hostWillLoad();
    const next = ["two"];

    controller.commitValue(next);
    next.push("three");

    expect(values).toEqual([["two"]]);
    expect(controller.value).toEqual(["two"]);
  });
});
