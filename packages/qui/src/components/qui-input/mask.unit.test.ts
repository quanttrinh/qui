import { maskitoTransform } from "@maskito/core";
import { describe, expect, it } from "vitest";

import { clearMaskCache, compileMask } from "./mask";

const BACKSLASH = String.fromCodePoint(92);

describe("compileMask", () => {
  it("applies fixed-width tokens and literals", () => {
    const mask = compileMask("###-###");

    expect(maskitoTransform("123456", mask.options)).toBe("123-456");
    expect(maskitoTransform("12", mask.options)).toBe("12");
  });

  it("treats escaped characters as literals", () => {
    const mask = compileMask(String.raw`\#\?\A\W\\####`);

    expect(maskitoTransform("1234", mask.options)).toBe(String.raw`#?AW\1234`);
  });

  it("supports character classes", () => {
    const mask = compileMask("[a-zA-Z]{2}-####");

    expect(maskitoTransform("ab1234", mask.options)).toBe("ab-1234");
  });

  it("supports compact tokens", () => {
    const phone = compileMask("(###) ###-####");
    const product = compileMask("AA-####");
    const any = compileMask("?#");

    expect(maskitoTransform("15551234567", phone.options)).toBe("(155) 512-3456");
    expect(maskitoTransform("ab1234", product.options)).toBe("ab-1234");
    expect(maskitoTransform("x1", any.options)).toBe("x1");
  });

  it("escapes compact tokens for literal use", () => {
    const mask = compileMask(String.raw`\#-\?-\A-\W`);

    expect(maskitoTransform("", mask.options)).toBe("#-?-A-W");
  });

  it("treats old regex-style escapes as literals", () => {
    const mask = compileMask(String.raw`\d\w\s\D\W\S`);

    expect(maskitoTransform("", mask.options)).toBe("dwsDWS");
  });

  it("uses raw extraction that respects literals", () => {
    const mask = compileMask("X-AA-####");

    expect(mask.rawFromMasked("X-AB-1234")).toBe("AB1234");
  });

  it("rejects variable-width quantifiers until dynamic masks exist", () => {
    expect(() => compileMask("#+")).toThrow("Variable-width masks");
    expect(() => compileMask("#*")).toThrow("Variable-width masks");
    expect(() => compileMask("#{2,}")).toThrow("Variable-width masks");
    expect(() => compileMask("#{2,4}")).toThrow("Variable-width masks");
  });

  it("rejects unreasonable repetition counts", () => {
    expect(() => compileMask("#{0}")).toThrow("between 1 and");
    expect(() => compileMask("#{100000000}")).toThrow("between 1 and");
  });

  it("rejects malformed masks", () => {
    expect(() => compileMask("[abc")).toThrow("missing its closing ]");
    expect(() => compileMask(BACKSLASH)).toThrow("unescaped backslash");
    expect(() => compileMask("[]")).toThrow("cannot be empty");
  });

  it("caches compiled masks", () => {
    clearMaskCache();
    const pattern = "###";
    const first = compileMask(pattern);
    const second = compileMask(pattern);

    expect(first).toBe(second);
  });
});
