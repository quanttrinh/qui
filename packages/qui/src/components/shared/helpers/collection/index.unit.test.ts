import { describe, expect, it } from "vitest";

import { shallowEqual } from "./index";

describe("shallowEqual", () => {
  it("compares primitives with Object.is", () => {
    expect(shallowEqual("one", "one")).toBe(true);
    expect(shallowEqual("one", "two")).toBe(false);
    expect(shallowEqual(undefined, undefined)).toBe(true);
    expect(shallowEqual(undefined, false)).toBe(false);
    expect(shallowEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it("compares array entries without deep recursion", () => {
    expect(shallowEqual([true, false, "primary"], [true, false, "primary"])).toBe(true);
    expect(shallowEqual([true, false], [true, true])).toBe(false);
    expect(shallowEqual([true], [true, false])).toBe(false);
    expect(shallowEqual([{}], [{}])).toBe(false);
  });

  it("returns false for mismatched or non-array values", () => {
    expect(shallowEqual([], {})).toBe(false);
    expect(shallowEqual({ length: 0 }, [])).toBe(false);
  });
});
