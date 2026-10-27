import { describe, expect, it } from "vitest";

import { createReflectionElement, fakeTarget } from "../../test-utils/fake-aria";
import {
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
});
