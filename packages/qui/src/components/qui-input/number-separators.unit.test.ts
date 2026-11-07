import { describe, expect, it } from "vitest";

import { resolveNumberSeparators } from "./number-separators";

describe("resolveNumberSeparators", () => {
  it("resolves common locales", () => {
    expect(resolveNumberSeparators("en-US")).toEqual({ decimal: ".", group: "," });
    expect(resolveNumberSeparators("de-DE")).toEqual({ decimal: ",", group: "." });
    expect(resolveNumberSeparators("fr-FR").decimal).toBe(",");
    expect(resolveNumberSeparators("fr-FR").group).not.toBe(",");
  });

  it("falls back for an invalid locale", () => {
    expect(resolveNumberSeparators("not-a-locale")).toEqual({ decimal: ".", group: "," });
  });
});
