import { describe, expect, it, vi } from "vitest";

import { createFieldControl, focusElement } from "./control";

interface FakeElement {
  click: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  isConnected: boolean;
}

function fakeElement(isConnected = true): HTMLElement & FakeElement {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    click: vi.fn(),
    focus: vi.fn(),
    isConnected,
  } as unknown as HTMLElement & FakeElement;
}

describe("createFieldControl", () => {
  it("focuses and clicks the current element", () => {
    const element = fakeElement();
    const control = createFieldControl(() => element, { activateOnLabel: true });

    control.focus({ preventScroll: true });
    control.click?.();

    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(element.click).toHaveBeenCalledOnce();
  });

  it("resolves the element lazily on every call", () => {
    const first = fakeElement();
    const second = fakeElement();
    let current: HTMLElement | undefined = first;
    const control = createFieldControl(() => current, { activateOnLabel: true });

    control.focus();
    current = second;
    control.focus({ preventScroll: true });
    control.click?.();

    expect(first.focus).toHaveBeenCalledOnce();
    expect(second.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(second.click).toHaveBeenCalledOnce();
    expect(first.click).not.toHaveBeenCalled();
  });

  it("does not activate by default", () => {
    const element = fakeElement();
    const control = createFieldControl(() => element);

    expect(control.click).toBeUndefined();
  });

  it("does nothing when the element is missing", () => {
    const control = createFieldControl(() => undefined);

    expect(() => {
      control.focus();
      control.click?.();
    }).not.toThrow();
  });
});

describe("focusElement", () => {
  it("focuses after the current microtask", async () => {
    const element = fakeElement();

    const pending = focusElement(element, { preventScroll: true });

    expect(element.focus).not.toHaveBeenCalled();
    await pending;
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("ignores a missing element", async () => {
    await expect(focusElement(undefined)).resolves.toBeUndefined();
  });

  it("ignores a disconnected element", async () => {
    const element = fakeElement(false);

    await focusElement(element);

    expect(element.focus).not.toHaveBeenCalled();
  });
});
