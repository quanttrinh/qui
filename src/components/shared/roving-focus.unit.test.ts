import { describe, expect, it, vi } from "vitest";

import {
  RovingFocusRegistry,
  sameTriggerRegistration,
  type TriggerRegistration,
} from "./roving-focus";

interface FakeHost extends HTMLElement {
  order: number;
}

function registration(value: string, disabled = false, order = 0): TriggerRegistration {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const trigger = { disabled, focus: vi.fn() } as unknown as HTMLButtonElement;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const host = {
    order,
    compareDocumentPosition(other: FakeHost): number {
      if (this.order === other.order) {
        return 0;
      }
      return this.order < other.order ? 4 : 2;
    },
  } as unknown as FakeHost;
  return { value, host, trigger };
}

describe("RovingFocusRegistry", () => {
  it("returns enabled registrations in order and ignores disabled ones", () => {
    const registry = new RovingFocusRegistry<TriggerRegistration>();
    const first = registration("one", false, 1);
    const disabled = registration("two", true, 2);
    const last = registration("three", false, 3);
    registry.register("one", first, sameTriggerRegistration);
    registry.register("two", disabled, sameTriggerRegistration);
    registry.register("three", last, sameTriggerRegistration);

    expect(registry.enabled()).toEqual([first, last]);
    expect(registry.edge("first")).toBe(first);
    expect(registry.edge("last")).toBe(last);
  });

  it("orders registrations by DOM position rather than registration order", () => {
    const registry = new RovingFocusRegistry<TriggerRegistration>();
    const third = registration("three", false, 3);
    const first = registration("one", false, 1);
    const second = registration("two", false, 2);

    registry.register("three", third, sameTriggerRegistration);
    registry.register("one", first, sameTriggerRegistration);
    registry.register("two", second, sameTriggerRegistration);

    expect(registry.enabled()).toEqual([first, second, third]);
  });

  it("focuses the internal trigger button", () => {
    const registry = new RovingFocusRegistry<TriggerRegistration>();
    const target = registration("one");
    registry.register("one", target, sameTriggerRegistration);

    registry.focusTrigger("one");
    registry.focusTrigger("missing");

    expect(Reflect.get(target.trigger, "focus")).toHaveBeenCalledOnce();
  });

  it("returns undefined at an edge when every trigger is disabled", () => {
    const registry = new RovingFocusRegistry<TriggerRegistration>();
    registry.register("one", registration("one", true), sameTriggerRegistration);

    expect(registry.edge("first")).toBeUndefined();
    expect(registry.edge("last")).toBeUndefined();
  });
});
