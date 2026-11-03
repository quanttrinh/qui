import { describe, expect, it } from "vitest";

import { filterNumericOrDecimalInput } from "./input-filter";

const numeric = { allowNegative: true, mode: "numeric" as const };
const decimal = { allowNegative: true, mode: "decimal" as const };

describe("filterNumericOrDecimalInput", () => {
  it("filters numeric input", () => {
    expect(filterNumericOrDecimalInput("0123", numeric)).toBe("123");
    expect(filterNumericOrDecimalInput("0", numeric)).toBe("0");
    expect(filterNumericOrDecimalInput("-0012", numeric)).toBe("-12");
    expect(filterNumericOrDecimalInput("1--2", numeric)).toBe("12");
    expect(filterNumericOrDecimalInput("1.2", numeric)).toBe("12");
    expect(filterNumericOrDecimalInput("-12", { ...numeric, allowNegative: false })).toBe("12");
  });

  it("filters decimal input", () => {
    expect(filterNumericOrDecimalInput("00..5", decimal)).toBe("0.5");
    expect(filterNumericOrDecimalInput("-.5", decimal)).toBe("-0.5");
    expect(filterNumericOrDecimalInput("1,,2", decimal)).toBe("1,2");
    expect(filterNumericOrDecimalInput("1--2", decimal)).toBe("12");
    expect(filterNumericOrDecimalInput("1,234.56", decimal)).toBe("1,234.56");
  });
});
