/**
 * Test-only helpers for asserting ARIA element-reflection relationships.
 *
 * These utilities are intentionally not exported from a package entry point.
 */

import { expect } from "vitest";

/** ARIA element-reflection properties that hold an ordered list of elements. */
export type AriaElementProperty =
  | "ariaControlsElements"
  | "ariaDescribedByElements"
  | "ariaErrorMessageElements"
  | "ariaLabelledByElements";

/** Expected elements keyed by ARIA element-reflection property. */
export type AriaExpectations = Partial<Record<AriaElementProperty, readonly Element[]>>;

/** Direction of a trigger/target relationship. */
export type AriaLinkDirection = "controls" | "labelledby";

const ariaElementProperties = [
  "ariaControlsElements",
  "ariaDescribedByElements",
  "ariaErrorMessageElements",
  "ariaLabelledByElements",
] as const satisfies readonly AriaElementProperty[];

/** Returns the elements reflected by `property` on `element`. */
export function ariaElements(element: Element, property: AriaElementProperty): Element[] {
  const value: unknown = Reflect.get(element, property);
  if (value === null || value === undefined) {
    return [];
  }
  // Chromium returns a reflected element list, which is array-like but not
  // Guaranteed to satisfy Array.isArray() in every test environment.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return [...(value as Iterable<Element>)];
}

/** Asserts every ARIA element-reflection property provided in `expected`. */
export function expectAriaElements(element: Element, expected: AriaExpectations): void {
  for (const property of ariaElementProperties) {
    const elements = expected[property];
    if (elements !== undefined) {
      expect(ariaElements(element, property), `${property} on ${element.tagName}`).toEqual(
        elements,
      );
    }
  }
}

/**
 * Asserts a trigger/target link. `controls` checks the trigger's
 * `ariaControlsElements`; `labelledby` checks the target's
 * `ariaLabelledByElements`.
 */
export function expectLinked(
  trigger: Element,
  target: Element,
  direction: AriaLinkDirection,
): void {
  if (direction === "controls") {
    expectAriaElements(trigger, { ariaControlsElements: [target] });
    return;
  }

  expectAriaElements(trigger, { ariaLabelledByElements: [target] });
}
