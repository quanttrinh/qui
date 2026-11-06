import { maskitoTransform } from "@maskito/core";
import { describe, expect, it } from "vitest";

import { clearMaskCache, compileMask } from "./mask";

describe("compileMask", () => {
  it("applies fixed-width tokens and literals", () => {
    const mask = compileMask("\\d{3}-\\d{3}");

    expect(maskitoTransform("123456", mask.options)).toBe("123-456");
    expect(maskitoTransform("12", mask.options)).toBe("12");
  });

  it("supports escaped literal characters", () => {
    const mask = compileMask("\\+\\d \\(\\d{3}\\)-\\d{3}-\\d{4}");

    expect(maskitoTransform("15551234567", mask.options)).toBe("+1 (555)-123-4567");
    expect(maskitoTransform("1555", mask.options)).toBe("+1 (555");
  });

  it("supports character classes", () => {
    const mask = compileMask("[a-zA-Z]{2}-\\d{4}");

    expect(maskitoTransform("ab1234", mask.options)).toBe("ab-1234");
  });

  it("uses raw extraction that respects literals", () => {
    const mask = compileMask("X-\\w{2}-\\d{4}");

    expect(mask.rawFromMasked("X-AB-1234")).toBe("AB1234");
  });

  it("maps raw character counts back to masked caret positions", () => {
    const mask = compileMask("[a-zA-Z]{2}-\\d{4}");

    expect(mask.caretForRaw("AB-1234", 0)).toBe(0);
    expect(mask.caretForRaw("AB-1234", 2)).toBe(2);
    expect(mask.caretForRaw("AB-1234", 3)).toBe(4);
  });

  it("rejects variable-width quantifiers until dynamic masks exist", () => {
    expect(() => compileMask("\\d+")).toThrow("Variable-width masks");
    expect(() => compileMask("\\d*")).toThrow("Variable-width masks");
    expect(() => compileMask("\\d?")).toThrow("Variable-width masks");
    expect(() => compileMask("\\d{2,}")).toThrow("Variable-width masks");
    expect(() => compileMask("\\d{2,4}")).toThrow("Variable-width masks");
  });

  it("rejects malformed masks", () => {
    expect(() => compileMask("[abc")).toThrow("missing its closing ]");
    expect(() => compileMask("\\")).toThrow("unescaped backslash");
    expect(() => compileMask("[]")).toThrow("cannot be empty");
  });

  it("caches compiled masks", () => {
    clearMaskCache();

    expect(compileMask("\\d{3}")).toBe(compileMask("\\d{3}"));
  });
});
