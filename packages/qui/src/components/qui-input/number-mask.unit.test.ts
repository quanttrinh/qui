import { maskitoTransform } from "@maskito/core";
import { describe, expect, it } from "vitest";

import {
  canStepNumber,
  compileNumberMask,
  formatNumber,
  numberValidity,
  parseNumber,
  stepNumber,
} from "./number-mask";

const decimalMask = compileNumberMask({ allowNegative: true, decimal: true });
const integerMask = compileNumberMask({ allowNegative: false, decimal: false });

describe("compileNumberMask", () => {
  it("normalizes separators, signs, and leading zeros", () => {
    expect(maskitoTransform("001,5", decimalMask)).toBe("1.5");
    expect(maskitoTransform("-.5", decimalMask)).toBe("-0.5");
    expect(maskitoTransform("1.2.3", decimalMask)).toBe("1.23");
    expect(maskitoTransform("1a2", decimalMask)).toBe("12");
  });

  it("rejects the minus sign when negative values are not allowed", () => {
    expect(maskitoTransform("-12", integerMask)).toBe("12");
  });

  it("rejects decimal separators in integer mode", () => {
    expect(maskitoTransform("1.5", integerMask)).toBe("15");
  });
});

describe("number helpers", () => {
  it("parses and formats plain numbers", () => {
    expect(parseNumber("1.5")).toBe(1.5);
    expect(parseNumber("1,5")).toBe(1.5);
    expect(parseNumber("-")).toBe(Number.NaN);
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
  });

  it("reports range, step, and bad input validity", () => {
    expect(numberValidity("5", { min: 1, max: 3 }).flags.rangeOverflow).toBe(true);
    expect(numberValidity("0", { min: 1, max: 3 }).flags.rangeUnderflow).toBe(true);
    expect(numberValidity("1.5", { step: 1 }).flags.stepMismatch).toBe(true);
    expect(numberValidity(".", {}).flags.badInput).toBe(true);
    expect(numberValidity("2", { min: 1, max: 3, step: 1 }).flags).toEqual({});
  });

  it("steps within bounds and respects step any", () => {
    expect(stepNumber(1.5, 1, {})).toBe(2.5);
    expect(stepNumber(1.5, 1, { step: 1 })).toBe(2);
    expect(stepNumber(3, 1, { min: 1, max: 3, step: 1 })).toBe(3);
    expect(canStepNumber("3", 1, { max: 3 })).toBe(false);
  });
});
