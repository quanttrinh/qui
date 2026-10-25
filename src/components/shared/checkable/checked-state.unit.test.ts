import { describe, expect, it } from "vitest";

import { normalizeBoolean, normalizeChecked } from "./checked-state";

describe("normalizeChecked", () => {
  it("normalizes the indeterminate attribute value", () => {
    expect(normalizeChecked("indeterminate")).toBe("indeterminate");
  });

  it("normalizes boolean attribute values", () => {
    expect(normalizeChecked("")).toBe(true);
    expect(normalizeChecked("true")).toBe(true);
    expect(normalizeChecked(true)).toBe(true);
    expect(normalizeChecked("false")).toBe(false);
    expect(normalizeChecked(false)).toBe(false);
  });

  it("leaves unknown values undefined", () => {
    expect(normalizeChecked(undefined)).toBeUndefined();
    expect(normalizeChecked("other")).toBeUndefined();
  });
});

describe("normalizeBoolean", () => {
  it("normalizes boolean attribute values", () => {
    expect(normalizeBoolean("")).toBe(true);
    expect(normalizeBoolean("true")).toBe(true);
    expect(normalizeBoolean(true)).toBe(true);
    expect(normalizeBoolean("false")).toBe(false);
    expect(normalizeBoolean(false)).toBe(false);
  });

  it("leaves unknown values undefined", () => {
    expect(normalizeBoolean(undefined)).toBeUndefined();
    expect(normalizeBoolean("indeterminate")).toBeUndefined();
  });
});
