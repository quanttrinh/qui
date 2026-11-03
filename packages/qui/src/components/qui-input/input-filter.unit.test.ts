import { describe, expect, it } from "vitest";

import { filterInputValue } from "./input-filter";

const numeric = { allowNegative: true, mode: "numeric" as const };
const decimal = { allowNegative: true, mode: "decimal" as const };

describe("filterInputValue", () => {
  it("filters numeric input", () => {
    expect(filterInputValue("0123", numeric)).toBe("123");
    expect(filterInputValue("0", numeric)).toBe("0");
    expect(filterInputValue("-0012", numeric)).toBe("-12");
    expect(filterInputValue("1--2", numeric)).toBe("12");
    expect(filterInputValue("1.2", numeric)).toBe("12");
    expect(filterInputValue("-12", { ...numeric, allowNegative: false })).toBe("12");
  });

  it("filters decimal input", () => {
    expect(filterInputValue("00..5", decimal)).toBe("0.5");
    expect(filterInputValue("-.5", decimal)).toBe("-0.5");
    expect(filterInputValue("1,,2", decimal)).toBe("1,2");
    expect(filterInputValue("1--2", decimal)).toBe("12");
    expect(filterInputValue("1,234.56", decimal)).toBe("1,234.56");
  });
});
