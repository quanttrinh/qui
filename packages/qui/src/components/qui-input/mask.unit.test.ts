import { maskitoTransform } from "@maskito/core";
import { describe, expect, it } from "vitest";

import { clearMaskCache, compileMask } from "./mask";

const BACKSLASH = String.fromCodePoint(92);

describe("compileMask", () => {
  it("applies fixed-width tokens and literals", () => {
    const mask = compileMask(String.raw`\d{3}-\d{3}`);

    expect(maskitoTransform("123456", mask.options)).toBe("123-456");
    expect(maskitoTransform("12", mask.options)).toBe("12");
  });

  it("supports escaped literal characters", () => {
    const mask = compileMask(String.raw`\+\d \(\d{3}\)-\d{3}-\d{4}`);

    expect(maskitoTransform("15551234567", mask.options)).toBe("+1 (555)-123-4567");
    expect(maskitoTransform("1555", mask.options)).toBe("+1 (555");
  });

  it("supports character classes", () => {
    const mask = compileMask(String.raw`[a-zA-Z]{2}-\d{4}`);

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
    const mask = compileMask(String.raw`\#-\?`);

    expect(maskitoTransform("#-?", mask.options)).toBe("#-?");
  });

  it("uses raw extraction that respects literals", () => {
    const mask = compileMask(String.raw`X-\w{2}-\d{4}`);

    expect(mask.rawFromMasked("X-AB-1234")).toBe("AB1234");
  });

  it("rejects variable-width quantifiers until dynamic masks exist", () => {
    expect(() => compileMask(String.raw`\d+`)).toThrow("Variable-width masks");
    expect(() => compileMask(String.raw`\d*`)).toThrow("Variable-width masks");
    expect(() => compileMask(String.raw`\d{2,}`)).toThrow("Variable-width masks");
    expect(() => compileMask(String.raw`\d{2,4}`)).toThrow("Variable-width masks");
  });

  it("rejects malformed masks", () => {
    expect(() => compileMask("[abc")).toThrow("missing its closing ]");
    expect(() => compileMask(BACKSLASH)).toThrow("unescaped backslash");
    expect(() => compileMask("[]")).toThrow("cannot be empty");
  });

  it("caches compiled masks", () => {
    clearMaskCache();
    const pattern = String.raw`\d{3}`;
    const first = compileMask(pattern);
    const second = compileMask(pattern);

    expect(first).toBe(second);
  });
});
