import { describe, expect, it } from "vitest";

import { arrowDelta, edgeKey } from "./keyboard";

describe("arrowDelta", () => {
  it("returns 1 for ArrowDown in a vertical widget", () => {
    expect(arrowDelta("ArrowDown", "vertical", false)).toBe(1);
    expect(arrowDelta("ArrowDown", "vertical", true)).toBe(1);
  });

  it("returns -1 for ArrowUp in a vertical widget", () => {
    expect(arrowDelta("ArrowUp", "vertical", false)).toBe(-1);
    expect(arrowDelta("ArrowUp", "vertical", true)).toBe(-1);
  });

  it("returns -1 for ArrowLeft and 1 for ArrowRight in an LTR horizontal widget", () => {
    expect(arrowDelta("ArrowLeft", "horizontal", false)).toBe(-1);
    expect(arrowDelta("ArrowRight", "horizontal", false)).toBe(1);
  });

  it("mirrors horizontal arrows in an RTL widget", () => {
    expect(arrowDelta("ArrowLeft", "horizontal", true)).toBe(1);
    expect(arrowDelta("ArrowRight", "horizontal", true)).toBe(-1);
  });

  it("ignores vertical arrows in a horizontal widget", () => {
    expect(arrowDelta("ArrowUp", "horizontal", false)).toBeUndefined();
    expect(arrowDelta("ArrowDown", "horizontal", false)).toBeUndefined();
  });

  it("ignores horizontal arrows in a vertical widget", () => {
    expect(arrowDelta("ArrowLeft", "vertical", false)).toBeUndefined();
    expect(arrowDelta("ArrowRight", "vertical", false)).toBeUndefined();
  });

  it("ignores unrelated keys", () => {
    expect(arrowDelta("Enter", "vertical", false)).toBeUndefined();
    expect(arrowDelta(" ", "horizontal", false)).toBeUndefined();
    expect(arrowDelta("Home", "vertical", false)).toBeUndefined();
    expect(arrowDelta("End", "horizontal", false)).toBeUndefined();
  });
});

describe("edgeKey", () => {
  it("maps Home to the first item", () => {
    expect(edgeKey("Home")).toBe("first");
  });

  it("maps End to the last item", () => {
    expect(edgeKey("End")).toBe("last");
  });

  it("ignores unrelated keys", () => {
    expect(edgeKey("ArrowDown")).toBeUndefined();
    expect(edgeKey("ArrowLeft")).toBeUndefined();
    expect(edgeKey("Enter")).toBeUndefined();
    expect(edgeKey(" ")).toBeUndefined();
  });
});
