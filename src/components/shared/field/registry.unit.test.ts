import { describe, expect, it, vi } from "vitest";

import { fakeTarget } from "../../../test-utils/fake-aria";
import { FieldPartRegistry } from "./registry";

describe("FieldPartRegistry", () => {
  it("tracks label, helper, and error hosts in registration order", () => {
    const registry = new FieldPartRegistry();
    const label = fakeTarget("label");
    const helper = fakeTarget("helper");
    const error = fakeTarget("error");

    expect(registry.labelHost).toBeUndefined();
    expect(registry.helperTextHosts).toEqual([]);
    expect(registry.errorTextHosts).toEqual([]);

    registry.registerLabel(label);
    registry.registerHelperText(helper);
    registry.registerErrorText(error);

    expect(registry.labelHost).toBe(label);
    expect(registry.helperTextHosts).toEqual([helper]);
    expect(registry.errorTextHosts).toEqual([error]);
  });

  it("removes only the matching host on teardown", () => {
    const registry = new FieldPartRegistry();
    const first = fakeTarget("first");
    const second = fakeTarget("second");
    const unregisterLabel = registry.registerLabel(first);
    const unregisterHelper = registry.registerHelperText(first);
    const unregisterError = registry.registerErrorText(first);
    registry.registerLabel(second);
    registry.registerHelperText(second);
    registry.registerErrorText(second);

    unregisterLabel();
    unregisterHelper();
    unregisterError();

    expect(registry.labelHost).toBe(second);
    expect(registry.helperTextHosts).toEqual([second]);
    expect(registry.errorTextHosts).toEqual([second]);
  });

  it("keeps an earlier label when a later label unregisters", () => {
    const registry = new FieldPartRegistry();
    const first = fakeTarget("first");
    const second = fakeTarget("second");
    registry.registerLabel(first);
    const unregisterSecond = registry.registerLabel(second);

    unregisterSecond();

    expect(registry.labelHost).toBe(first);
  });

  it("focuses and clicks the first registered control", () => {
    const registry = new FieldPartRegistry();
    const first = { focus: vi.fn(), click: vi.fn() };
    const second = { focus: vi.fn() };
    registry.registerControl(first);
    registry.registerControl(second);

    registry.focusControl({ preventScroll: true });
    registry.clickControl();

    expect(first.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(first.click).toHaveBeenCalledOnce();
    expect(second.focus).not.toHaveBeenCalled();
  });

  it("falls back to focus when a control has no click handler", () => {
    const registry = new FieldPartRegistry();
    const control = { focus: vi.fn() };
    registry.registerControl(control);

    registry.clickControl();

    expect(control.focus).toHaveBeenCalledOnce();
  });

  it("ignores focus and click when no control is registered", () => {
    const registry = new FieldPartRegistry();

    expect(() => {
      registry.focusControl();
      registry.clickControl();
    }).not.toThrow();
  });
});
