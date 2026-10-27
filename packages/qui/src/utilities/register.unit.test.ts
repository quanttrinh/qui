import { describe, expect, it } from "vitest";

import { defineComponents } from "./register";

describe("defineComponents", () => {
  it("registers only the definitions it receives", () => {
    const calls: string[] = [];

    defineComponents(
      () => {
        calls.push("button");
      },
      () => {
        calls.push("input");
      },
    );

    expect(calls).toEqual(["button", "input"]);
  });
});
