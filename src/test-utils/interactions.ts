/**
 * Test-only helpers for dispatching user interactions.
 *
 * These utilities are intentionally not exported from a package entry point.
 */

import { expect } from "vitest";

import { isDeepActiveElement } from "./shadow";

/** Dispatches a bubbling, composed keydown event with `key`. */
export function pressKey(element: Element, key: string): void {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, key }),
  );
}

/** Dispatches a bubbling, composed pointerdown event. */
export function pointerDown(element: Element): void {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerType: "mouse",
    }),
  );
}

/** Sets a native control's value and dispatches its bubbling input event. */
export function typeInto(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Asserts that `element` is the deeply focused element across shadow roots. */
export function expectFocusedDeep(element: Element): void {
  expect(isDeepActiveElement(element)).toBe(true);
}
