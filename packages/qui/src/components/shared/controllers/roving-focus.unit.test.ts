import { describe, expect, it, vi } from "vitest";

import {
  moveIndex,
  RovingFocusRegistry,
  sameTriggerRegistration,
  type TriggerRegistration,
} from "./roving-focus";

interface FakeHost extends HTMLElement {
  order: number;
}

function registration(value: string, disabled = false, order = 0): TriggerRegistration {
  const trigger = { disabled, focus: vi.fn() } as unknown as HTMLButtonElement;
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

const entries = ["one", "two", "three"];

describe("moveIndex", () => {
  it("moves within the list and stops at edges when not looping", () => {
    expect(moveIndex(entries, 0, { delta: 1 })).toBe(1);
    expect(moveIndex(entries, 2, { delta: -1 })).toBe(1);
    expect(moveIndex(entries, 2, { delta: 1 })).toBeUndefined();
    expect(moveIndex(entries, 0, { delta: -1 })).toBeUndefined();
  });

  it("wraps when looping", () => {
    expect(moveIndex(entries, 2, { delta: 1, loop: true })).toBe(0);
    expect(moveIndex(entries, 0, { delta: -1, loop: true })).toBe(2);
  });

  it("selects an edge when the current index is missing", () => {
    expect(moveIndex(entries, -1, { delta: 1 })).toBe(0);
    expect(moveIndex(entries, -1, { delta: -1 })).toBe(2);
    expect(moveIndex(entries, -1, { delta: 1, selectEdge: false })).toBe(0);
  });

  it("returns undefined for an empty list", () => {
    expect(moveIndex([], -1, { delta: 1, loop: true })).toBeUndefined();
  });
});

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
