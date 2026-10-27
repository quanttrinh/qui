import { describe, expect, it } from "vitest";

import { createReflectionElement, fakeTarget } from "../../../test-utils/fake-aria";
import { applyFieldAria } from "./aria";
import { type FieldApi } from "./context";

function createControl(supported: boolean) {
  return createReflectionElement(supported, [
    "ariaDescribedByElements",
    "ariaErrorMessageElements",
    "ariaLabelledByElements",
  ]);
}

function createField(
  label?: HTMLElement,
  helpers: HTMLElement[] = [],
  errors: HTMLElement[] = [],
): FieldApi {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    getLabelHost: () => label,
    getHelperTextHosts: () => helpers,
    getErrorTextHosts: () => errors,
  } as unknown as FieldApi;
}

describe("applyFieldAria", () => {
  it("targets field host elements on the control", () => {
    const control = createControl(true);
    const label = fakeTarget("label");
    const helper = fakeTarget("helper");
    const error = fakeTarget("error");
    const counter = fakeTarget("counter");

    applyFieldAria(control, createField(label, [helper], [error]), {
      describedBy: [counter],
    });

    expect(control.ariaLabelledByElements).toEqual([label]);
    expect(control.ariaDescribedByElements).toEqual([helper, counter]);
    expect(control.ariaErrorMessageElements).toEqual([error]);
  });

  it("falls back to host ids when reflection is unavailable", () => {
    const control = createControl(false);
    const label = fakeTarget("label");
    const helper = fakeTarget("helper");
    const error = fakeTarget("error");

    applyFieldAria(control, createField(label, [helper], [error]));

    expect(control.getAttribute("aria-labelledby")).toBe("label");
    expect(control.getAttribute("aria-describedby")).toBe("helper");
    expect(control.getAttribute("aria-errormessage")).toBe("error");
  });

  it("keeps internal elements when the control has no field", () => {
    const control = createControl(true);
    const internalLabel = fakeTarget("internal-label");
    const counter = fakeTarget("counter");

    applyFieldAria(control, undefined, {
      labelledBy: [internalLabel],
      describedBy: [counter],
    });

    expect(control.ariaLabelledByElements).toEqual([internalLabel]);
    expect(control.ariaDescribedByElements).toEqual([counter]);
    expect(control.ariaErrorMessageElements).toEqual([]);
  });

  it("clears relationships when the field has no registered parts", () => {
    const control = createControl(true);
    control.setAttribute("aria-labelledby", "stale");
    control.setAttribute("aria-describedby", "stale");
    control.setAttribute("aria-errormessage", "stale");

    applyFieldAria(control, createField());

    expect(control.ariaLabelledByElements).toEqual([]);
    expect(control.ariaDescribedByElements).toEqual([]);
    expect(control.ariaErrorMessageElements).toEqual([]);
    expect(control.hasAttribute("aria-labelledby")).toBe(false);
    expect(control.hasAttribute("aria-describedby")).toBe(false);
    expect(control.hasAttribute("aria-errormessage")).toBe(false);
  });

  it("ignores a missing control", () => {
    expect(() => {
      applyFieldAria(undefined, createField(fakeTarget("label")));
    }).not.toThrow();
  });
});
