import { describe, expect, it } from "vitest";

import { applyMask, formatMask, unmask } from "./mask";

describe("mask helpers", () => {
  it("applies digits, letters, and alphanumeric placeholders", () => {
    expect(applyMask("1234", "#### #### #### ####")).toBe("1234");
    expect(applyMask("1234567812345678", "#### #### #### ####")).toBe("1234 5678 1234 5678");
    expect(applyMask("ab123456c", "aa-######-a")).toBe("ab-123456-c");
    expect(applyMask("a1b2", "**-**")).toBe("a1-b2");
  });

  it("drops invalid characters and trailing literals", () => {
    expect(applyMask("12a34", "###-###")).toBe("123-4");
    expect(applyMask("12", "###-###")).toBe("12");
    expect(applyMask("", "###-###")).toBe("");
  });

  it("removes every non-alphanumeric character", () => {
    expect(unmask("(555) 123-4567")).toBe("5551234567");
    expect(unmask("ab-12_cd")).toBe("ab12cd");
  });

  it("keeps the caret next to the same placeholder", () => {
    expect(formatMask("1234", "###-###", 3)).toEqual({ value: "123-4", caret: 3 });
    expect(formatMask("1234", "###-###", 1)).toEqual({ value: "123-4", caret: 1 });
    expect(formatMask("12a", "###-###", 3)).toEqual({ value: "12", caret: 2 });
  });
});
