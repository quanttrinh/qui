import { describe, expect, it } from "vitest";

import { uniqueValues } from "./index";

describe("uniqueValues", () => {
  it("returns distinct values in argument order", () => {
    expect(uniqueValues("two", "one", "two")).toEqual(["two", "one"]);
  });

  it("drops undefined entries", () => {
    expect(uniqueValues(undefined, "one", undefined)).toEqual(["one"]);
  });

  it("returns an empty list when every entry is undefined", () => {
    expect(uniqueValues(undefined, undefined)).toEqual([]);
  });
});
