import { describe, expect, it } from "vitest";

import { applyTextCase } from "./case";

describe("applyTextCase", () => {
  it("leaves values unchanged when disabled", () => {
    expect(applyTextCase("Mixed Case", "none")).toBe("Mixed Case");
  });

  it("uppercases and lowercases values", () => {
    expect(applyTextCase("Mixed Case", "uppercase")).toBe("MIXED CASE");
    expect(applyTextCase("Mixed Case", "lowercase")).toBe("mixed case");
  });

  it("uses JavaScript case mapping", () => {
    expect(applyTextCase("straße", "uppercase")).toBe("STRASSE");
    expect(applyTextCase("İSTANBUL", "lowercase")).toBe("i̇stanbul");
  });
});
