import { describe, expect, it } from "vitest";

import { createReflectionElement, fakeTarget } from "../../test-utils/fake-aria";
import {
  setAriaActiveDescendant,
  setAriaControls,
  setAriaDescribedBy,
  setAriaErrorMessage,
  setAriaLabelledBy,
} from "./aria";

const listCases = [
  {
    attribute: "aria-labelledby",
    property: "ariaLabelledByElements",
    set: setAriaLabelledBy,
  },
  {
    attribute: "aria-describedby",
    property: "ariaDescribedByElements",
    set: setAriaDescribedBy,
  },
  {
    attribute: "aria-errormessage",
    property: "ariaErrorMessageElements",
    set: setAriaErrorMessage,
  },
  {
    attribute: "aria-controls",
    property: "ariaControlsElements",
    set: setAriaControls,
  },
] as const;

describe("ARIA host-targeting helpers", () => {
  for (const { attribute, property, set } of listCases) {
    it(`assigns ${property} when element reflection is supported`, () => {
      const element = createReflectionElement(true);
      element.setAttribute(attribute, "stale");
      const label = fakeTarget("label");

      set(element, [label]);

      expect(element[property]).toEqual([label]);
      expect(element.hasAttribute(attribute)).toBe(false);
    });

    it(`falls back to ${attribute} IDREFs and filters empty ids`, () => {
      const element = createReflectionElement(false);
      const first = fakeTarget("first");
      const second = fakeTarget("second");

      set(element, [first, fakeTarget(""), second]);

      expect(element.getAttribute(attribute)).toBe("first second");
      expect(element[property]).toBeUndefined();
    });

    it(`clears ${property} and ${attribute} for empty targets`, () => {
      const supported = createReflectionElement(true);
      supported.setAttribute(attribute, "stale");
      set(supported, [fakeTarget("label")]);
      set(supported, []);
      expect(supported[property]).toEqual([]);
      expect(supported.hasAttribute(attribute)).toBe(false);

      const fallback = createReflectionElement(false);
      fallback.setAttribute(attribute, "stale");
      set(fallback, []);
      expect(fallback.hasAttribute(attribute)).toBe(false);
    });
  }

  it("assigns ariaActiveDescendantElement when reflection is supported", () => {
    const element = createReflectionElement(true);
    element.setAttribute("aria-activedescendant", "stale");
    const option = fakeTarget("option-1");

    setAriaActiveDescendant(element, option);

    expect(element.ariaActiveDescendantElement).toBe(option);
    expect(element.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("falls back to aria-activedescendant IDREFs", () => {
    const element = createReflectionElement(false);

    setAriaActiveDescendant(element, fakeTarget("option-1"));

    expect(element.getAttribute("aria-activedescendant")).toBe("option-1");
    expect(element.ariaActiveDescendantElement).toBeUndefined();
  });

  it("clears ariaActiveDescendantElement when the target is undefined", () => {
    const element = createReflectionElement(true);
    element.ariaActiveDescendantElement = fakeTarget("option-1");
    element.setAttribute("aria-activedescendant", "stale");

    setAriaActiveDescendant(element, undefined);

    expect(element.ariaActiveDescendantElement).toBeNull();
    expect(element.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("clears the aria-activedescendant fallback when the target is undefined", () => {
    const element = createReflectionElement(false);
    element.setAttribute("aria-activedescendant", "stale");

    setAriaActiveDescendant(element, undefined);

    expect(element.hasAttribute("aria-activedescendant")).toBe(false);
  });
});
